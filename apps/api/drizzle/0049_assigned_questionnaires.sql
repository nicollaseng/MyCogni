CREATE TYPE "public"."questionnaire_assignment_status" AS ENUM('assigned', 'in_progress', 'completed', 'cancelled', 'expired');--> statement-breakpoint
ALTER TYPE "public"."notification_kind" ADD VALUE IF NOT EXISTS 'questionnaire_assigned';--> statement-breakpoint
ALTER TYPE "public"."notification_kind" ADD VALUE IF NOT EXISTS 'questionnaire_completed';--> statement-breakpoint
CREATE TABLE "questionnaire_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"care_link_id" uuid NOT NULL,
	"instrument_id" text NOT NULL,
	"variant" text NOT NULL,
	"note" text,
	"repeat_every_days" smallint,
	"available_from" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "questionnaire_assignment_status" DEFAULT 'assigned' NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "questionnaire_assignments_note_length" CHECK (char_length("questionnaire_assignments"."note") <= 280),
	CONSTRAINT "questionnaire_assignments_repeat" CHECK ("questionnaire_assignments"."repeat_every_days" is null or "questionnaire_assignments"."repeat_every_days" in (7, 14, 28)),
	CONSTRAINT "questionnaire_assignments_instrument" CHECK (char_length("questionnaire_assignments"."instrument_id") between 1 and 40 and char_length("questionnaire_assignments"."variant") between 1 and 40),
	CONSTRAINT "questionnaire_assignments_completed" CHECK (("questionnaire_assignments"."status" = 'completed') = ("questionnaire_assignments"."completed_at" is not null)),
	CONSTRAINT "questionnaire_assignments_cancelled" CHECK (("questionnaire_assignments"."status" = 'cancelled') = ("questionnaire_assignments"."cancelled_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "questionnaire_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"instrument_id" text NOT NULL,
	"instrument_version" text NOT NULL,
	"locale" text NOT NULL,
	"answers" jsonb NOT NULL,
	"score" jsonb,
	"flags" text[] DEFAULT '{}'::text[] NOT NULL,
	"consented_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "questionnaire_responses_assignment_id_unique" UNIQUE("assignment_id"),
	CONSTRAINT "questionnaire_responses_locale" CHECK ("questionnaire_responses"."locale" in ('pt-BR', 'pt-PT', 'en-US', 'en-GB')),
	CONSTRAINT "questionnaire_responses_answers" CHECK (jsonb_typeof("questionnaire_responses"."answers") = 'array'),
	CONSTRAINT "questionnaire_responses_completed" CHECK (("questionnaire_responses"."completed_at" is null) = ("questionnaire_responses"."score" is null))
);
--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "questionnaire_assignment_id" uuid;--> statement-breakpoint
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_care_link_id_care_links_id_fk" FOREIGN KEY ("care_link_id") REFERENCES "public"."care_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_assignment_id_questionnaire_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."questionnaire_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "questionnaire_assignments_patient_idx" ON "questionnaire_assignments" USING btree ("patient_id","available_from" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "questionnaire_assignments_professional_idx" ON "questionnaire_assignments" USING btree ("professional_id","patient_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "questionnaire_assignments_link_idx" ON "questionnaire_assignments" USING btree ("care_link_id");--> statement-breakpoint
CREATE INDEX "questionnaire_assignments_due_idx" ON "questionnaire_assignments" USING btree ("available_from") WHERE status = 'assigned' and notified_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX "questionnaire_assignments_one_open_key" ON "questionnaire_assignments" USING btree ("professional_id","patient_id","variant") WHERE status in ('assigned', 'in_progress');--> statement-breakpoint
CREATE INDEX "questionnaire_responses_patient_idx" ON "questionnaire_responses" USING btree ("patient_id","started_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_questionnaire_assignment_id_questionnaire_assignments_id_fk" FOREIGN KEY ("questionnaire_assignment_id") REFERENCES "public"."questionnaire_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "questionnaire_assignments_select_patient" ON "questionnaire_assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("questionnaire_assignments"."patient_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "questionnaire_assignments_select_professional" ON "questionnaire_assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("questionnaire_assignments"."professional_id" = (select auth.uid()) and exists (
  select 1 from public.care_links cl
  where cl.id = "questionnaire_assignments"."care_link_id"
    and cl.professional_id = (select auth.uid())
    and cl.ended_at is null
));--> statement-breakpoint
CREATE POLICY "questionnaire_assignments_insert_professional" ON "questionnaire_assignments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("questionnaire_assignments"."professional_id" = (select auth.uid())
        and "questionnaire_assignments"."status" = 'assigned'
        and "questionnaire_assignments"."notified_at" is null
        and "questionnaire_assignments"."completed_at" is null
        and "questionnaire_assignments"."cancelled_at" is null
        and public.is_verified_professional()
        and exists (
          select 1 from public.care_links cl
          where cl.id = "questionnaire_assignments"."care_link_id"
            and cl.professional_id = (select auth.uid())
            and cl.patient_id = "questionnaire_assignments"."patient_id"
            and cl.ended_at is null
        ));--> statement-breakpoint
CREATE POLICY "questionnaire_assignments_cancel_professional" ON "questionnaire_assignments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("questionnaire_assignments"."professional_id" = (select auth.uid())
        and "questionnaire_assignments"."status" in ('assigned', 'in_progress')
        and exists (
  select 1 from public.care_links cl
  where cl.id = "questionnaire_assignments"."care_link_id"
    and cl.professional_id = (select auth.uid())
    and cl.ended_at is null
)) WITH CHECK ("questionnaire_assignments"."professional_id" = (select auth.uid())
        and "questionnaire_assignments"."status" = 'cancelled'
        and "questionnaire_assignments"."cancelled_at" is not null);--> statement-breakpoint
CREATE POLICY "questionnaire_responses_select_patient" ON "questionnaire_responses" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("questionnaire_responses"."patient_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "questionnaire_responses_select_professional" ON "questionnaire_responses" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("questionnaire_responses"."completed_at" is not null and exists (
        select 1 from public.questionnaire_assignments a
        join public.care_links cl on cl.id = a.care_link_id
        where a.id = "questionnaire_responses"."assignment_id"
          and a.professional_id = (select auth.uid())
          and cl.professional_id = (select auth.uid())
          and cl.ended_at is null
      ));--> statement-breakpoint
CREATE POLICY "questionnaire_responses_insert_patient" ON "questionnaire_responses" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("questionnaire_responses"."patient_id" = (select auth.uid())
        and public.current_account_type() = 'patient'
        and "questionnaire_responses"."completed_at" is null
        and "questionnaire_responses"."score" is null
        and "questionnaire_responses"."flags" = '{}'::text[]
        and exists (
          select 1 from public.questionnaire_assignments a
          where a.id = "questionnaire_responses"."assignment_id"
            and a.patient_id = (select auth.uid())
            and a.status = 'assigned'
            and a.available_from <= now()
        ));--> statement-breakpoint
CREATE POLICY "questionnaire_responses_update_patient" ON "questionnaire_responses" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("questionnaire_responses"."patient_id" = (select auth.uid())
        and "questionnaire_responses"."completed_at" is null
        and exists (
          select 1 from public.questionnaire_assignments a
          where a.id = "questionnaire_responses"."assignment_id"
            and a.patient_id = (select auth.uid())
            and a.status = 'in_progress'
        )) WITH CHECK ("questionnaire_responses"."patient_id" = (select auth.uid()));--> statement-breakpoint
REVOKE ALL ON public.questionnaire_assignments FROM anon;
--> statement-breakpoint
REVOKE ALL ON public.questionnaire_responses FROM anon;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON public.questionnaire_assignments FROM authenticated;
--> statement-breakpoint
GRANT UPDATE (status, cancelled_at) ON public.questionnaire_assignments TO authenticated;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON public.questionnaire_responses FROM authenticated;
--> statement-breakpoint
GRANT UPDATE (answers, score, flags, completed_at) ON public.questionnaire_responses TO authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.questionnaire_response_started()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.questionnaire_assignments
  SET status = 'in_progress'
  WHERE id = NEW.assignment_id AND status = 'assigned';
  RETURN NEW;
END
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.questionnaire_response_started() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER questionnaire_response_started
AFTER INSERT ON public.questionnaire_responses
FOR EACH ROW EXECUTE FUNCTION public.questionnaire_response_started();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.questionnaire_response_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  done public.questionnaire_assignments%ROWTYPE;
BEGIN
  UPDATE public.questionnaire_assignments
  SET status = 'completed', completed_at = NEW.completed_at
  WHERE id = NEW.assignment_id AND status = 'in_progress'
  RETURNING * INTO done;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The questionnaire is no longer in progress' USING ERRCODE = '55000';
  END IF;
  IF done.repeat_every_days IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.care_links cl
    WHERE cl.id = done.care_link_id AND cl.ended_at IS NULL
  ) THEN
    INSERT INTO public.questionnaire_assignments (
      professional_id, patient_id, care_link_id, instrument_id, variant, note,
      repeat_every_days, available_from
    )
    VALUES (
      done.professional_id, done.patient_id, done.care_link_id, done.instrument_id, done.variant,
      done.note, done.repeat_every_days,
      NEW.completed_at + make_interval(days => done.repeat_every_days)
    );
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.questionnaire_response_completed() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER questionnaire_response_completed
AFTER UPDATE OF completed_at ON public.questionnaire_responses
FOR EACH ROW
WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION public.questionnaire_response_completed();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.cancel_questionnaires_of_ended_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.questionnaire_assignments
  SET status = 'cancelled', cancelled_at = NEW.ended_at
  WHERE care_link_id = NEW.id AND status IN ('assigned', 'in_progress');
  RETURN NEW;
END
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.cancel_questionnaires_of_ended_link() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER care_link_ended_cancels_questionnaires
AFTER UPDATE OF ended_at ON public.care_links
FOR EACH ROW
WHEN (OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL)
EXECUTE FUNCTION public.cancel_questionnaires_of_ended_link();
