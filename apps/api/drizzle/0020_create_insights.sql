CREATE TYPE "public"."insight_audience" AS ENUM('patient', 'professional');--> statement-breakpoint
ALTER TYPE "public"."notification_kind" ADD VALUE 'insight';--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"audience" "insight_audience" NOT NULL,
	"professional_id" uuid,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"check_in_count" integer NOT NULL,
	"content" jsonb NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insights_audience_target" CHECK (("insights"."audience" = 'professional') = ("insights"."professional_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "insights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "insight_id" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "journal_in_insights" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "insights_patient_created_idx" ON "insights" USING btree ("patient_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "insights_professional_idx" ON "insights" USING btree ("professional_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "insights_select_own" ON "insights" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("insights"."audience" = 'patient' and "insights"."patient_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "insights_select_linked_professional" ON "insights" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("insights"."audience" = 'professional'
        and "insights"."professional_id" = (select auth.uid())
        and exists (
          select 1 from public.care_links cl
          where cl.patient_id = "insights"."patient_id"
            and cl.professional_id = (select auth.uid())
            and cl.ended_at is null
        ));