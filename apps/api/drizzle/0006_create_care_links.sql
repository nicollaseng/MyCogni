CREATE TYPE "public"."care_link_ended_by" AS ENUM('patient', 'professional');--> statement-breakpoint
CREATE TYPE "public"."invitation_channel" AS ENUM('email', 'link');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'canceled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('invitation', 'professional', 'marketing', 'system');--> statement-breakpoint
CREATE TYPE "public"."professional_kind" AS ENUM('psychologist', 'psychiatrist', 'physician', 'psychoanalyst');--> statement-breakpoint
CREATE TYPE "public"."professional_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "care_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"invitation_id" uuid,
	"shares_history" boolean DEFAULT false NOT NULL,
	"consent_version" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"ended_by" "care_link_ended_by"
);
--> statement-breakpoint
ALTER TABLE "care_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"professional_id" uuid NOT NULL,
	"channel" "invitation_channel" NOT NULL,
	"recipient_email" text,
	"patient_id" uuid,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "invitations_code_unique" UNIQUE("code"),
	CONSTRAINT "invitations_lifetime" CHECK ("invitations"."expires_at" <= "invitations"."created_at" + interval '72 hours'),
	CONSTRAINT "invitations_email_channel" CHECK ("invitations"."channel" <> 'email' or "invitations"."recipient_email" is not null)
);
--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"invitation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "professional_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"kind" "professional_kind" NOT NULL,
	"full_name" text NOT NULL,
	"registration" text,
	"status" "professional_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "professional_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "care_links" ADD CONSTRAINT "care_links_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_links" ADD CONSTRAINT "care_links_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_links" ADD CONSTRAINT "care_links_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "care_links_active_pair_key" ON "care_links" USING btree ("professional_id","patient_id") WHERE ended_at is null;--> statement-breakpoint
CREATE INDEX "care_links_patient_idx" ON "care_links" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "invitations_professional_idx" ON "invitations" USING btree ("professional_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "invitations_patient_idx" ON "invitations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "invitations_recipient_email_idx" ON "invitations" USING btree (lower("recipient_email"));--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE POLICY "assessments_select_linked_professional" ON "assessments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from public.care_links cl
        where cl.patient_id = "assessments"."user_id"
          and cl.professional_id = (select auth.uid())
          and cl.ended_at is null
          and (cl.shares_history or "assessments"."completed_at" >= cl.started_at)
      ));--> statement-breakpoint
CREATE POLICY "check_ins_select_linked_professional" ON "check_ins" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from public.care_links cl
        where cl.patient_id = "check_ins"."user_id"
          and cl.professional_id = (select auth.uid())
          and cl.ended_at is null
          and (cl.shares_history or "check_ins"."recorded_at" >= cl.started_at)
      ));--> statement-breakpoint
CREATE POLICY "profiles_select_linked_professional" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from public.care_links cl
        where cl.patient_id = "profiles"."id"
          and cl.professional_id = (select auth.uid())
          and cl.ended_at is null
      ));--> statement-breakpoint
CREATE POLICY "care_links_select_participants" ON "care_links" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("care_links"."professional_id" = (select auth.uid()) or "care_links"."patient_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "care_links_insert_by_patient" ON "care_links" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("care_links"."patient_id" = (select auth.uid())
        and "care_links"."ended_at" is null
        and exists (
          select 1 from public.invitations i
          where i.id = "care_links"."invitation_id"
            and i.patient_id = (select auth.uid())
            and i.professional_id = "care_links"."professional_id"
            and i.status = 'accepted'
        ));--> statement-breakpoint
CREATE POLICY "care_links_end_by_participant" ON "care_links" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (("care_links"."professional_id" = (select auth.uid()) or "care_links"."patient_id" = (select auth.uid())) and "care_links"."ended_at" is null) WITH CHECK (("care_links"."professional_id" = (select auth.uid()) or "care_links"."patient_id" = (select auth.uid())) and "care_links"."ended_at" is not null);--> statement-breakpoint
CREATE POLICY "invitations_select_participants" ON "invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("invitations"."professional_id" = (select auth.uid()) or "invitations"."patient_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "invitations_insert_verified_professional" ON "invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("invitations"."professional_id" = (select auth.uid())
        and "invitations"."patient_id" is null
        and "invitations"."status" = 'pending'
        and public.is_verified_professional());--> statement-breakpoint
CREATE POLICY "invitations_cancel_by_professional" ON "invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("invitations"."professional_id" = (select auth.uid()) and "invitations"."status" = 'pending') WITH CHECK ("invitations"."professional_id" = (select auth.uid()) and "invitations"."status" = 'canceled');--> statement-breakpoint
CREATE POLICY "invitations_respond_by_patient" ON "invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("invitations"."patient_id" = (select auth.uid()) and "invitations"."status" = 'pending' and "invitations"."expires_at" > now()) WITH CHECK ("invitations"."patient_id" = (select auth.uid()) and "invitations"."status" in ('accepted', 'declined'));--> statement-breakpoint
CREATE POLICY "notifications_select_own" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_update_own" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("notifications"."user_id" = (select auth.uid())) WITH CHECK ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "professional_profiles_select_own" ON "professional_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("professional_profiles"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "professional_profiles_select_by_invited_patients" ON "professional_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from public.invitations i where i.professional_id = "professional_profiles"."user_id" and i.patient_id = (select auth.uid()))
        or exists (select 1 from public.care_links cl where cl.professional_id = "professional_profiles"."user_id" and cl.patient_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "professional_profiles_insert_own_pending" ON "professional_profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("professional_profiles"."user_id" = (select auth.uid()) and "professional_profiles"."status" = 'pending' and "professional_profiles"."verified_at" is null);