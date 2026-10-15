CREATE TYPE "public"."alert_level" AS ENUM('urgent', 'watch', 'info');--> statement-breakpoint
CREATE TYPE "public"."alert_reason" AS ENUM('risk_item', 'summary_urgent', 'severe_screening', 'summary_watch', 'low_mood', 'mood_drop', 'inactive');--> statement-breakpoint
CREATE TABLE "professional_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"care_link_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"reason" "alert_reason" NOT NULL,
	"level" "alert_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"emailed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "professional_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "professional_alerts" ADD CONSTRAINT "professional_alerts_care_link_id_care_links_id_fk" FOREIGN KEY ("care_link_id") REFERENCES "public"."care_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_alerts" ADD CONSTRAINT "professional_alerts_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_alerts" ADD CONSTRAINT "professional_alerts_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "professional_alerts_open_key" ON "professional_alerts" USING btree ("care_link_id","reason") WHERE resolved_at is null;--> statement-breakpoint
CREATE INDEX "professional_alerts_professional_created_idx" ON "professional_alerts" USING btree ("professional_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "professional_alerts_emailed_idx" ON "professional_alerts" USING btree ("professional_id","patient_id","emailed_at") WHERE emailed_at is not null;--> statement-breakpoint
CREATE POLICY "professional_alerts_select_own_link" ON "professional_alerts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("professional_alerts"."professional_id" = (select auth.uid()) and exists (
  select 1 from public.care_links cl
  where cl.id = "professional_alerts"."care_link_id"
    and cl.professional_id = (select auth.uid())
    and cl.ended_at is null
));--> statement-breakpoint
CREATE POLICY "professional_alerts_update_open_own_link" ON "professional_alerts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("professional_alerts"."professional_id" = (select auth.uid()) and "professional_alerts"."resolved_at" is null and exists (
  select 1 from public.care_links cl
  where cl.id = "professional_alerts"."care_link_id"
    and cl.professional_id = (select auth.uid())
    and cl.ended_at is null
)) WITH CHECK ("professional_alerts"."professional_id" = (select auth.uid()));