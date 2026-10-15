CREATE TYPE "public"."assistant_mode" AS ENUM('personal', 'professional');--> statement-breakpoint
CREATE TYPE "public"."assistant_risk" AS ENUM('none', 'watch', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."assistant_role" AS ENUM('user', 'assistant', 'notice');--> statement-breakpoint
ALTER TYPE "public"."consent_kind" ADD VALUE 'assistant_data';--> statement-breakpoint
ALTER TYPE "public"."consent_kind" ADD VALUE 'assistant_journal';--> statement-breakpoint
CREATE TABLE "assistant_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"mode" "assistant_mode" NOT NULL,
	"patient_id" uuid,
	"risk" "assistant_risk" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_conversations_mode_target" CHECK (("assistant_conversations"."mode" = 'professional') = ("assistant_conversations"."patient_id" is not null)),
	CONSTRAINT "assistant_conversations_not_self" CHECK ("assistant_conversations"."patient_id" <> "assistant_conversations"."owner_id")
);
--> statement-breakpoint
ALTER TABLE "assistant_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assistant_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"role" "assistant_role" NOT NULL,
	"content" text NOT NULL,
	"risk" "assistant_risk" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_messages_content_length" CHECK (char_length("assistant_messages"."content") between 1 and 4000)
);
--> statement-breakpoint
ALTER TABLE "assistant_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assistant_conversations_owner_idx" ON "assistant_conversations" USING btree ("owner_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "assistant_conversations_patient_idx" ON "assistant_conversations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "assistant_messages_conversation_idx" ON "assistant_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE POLICY "assistant_conversations_select_own" ON "assistant_conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("assistant_conversations"."owner_id" = (select auth.uid()) and ("assistant_conversations"."mode" = 'personal' or exists (
    select 1 from public.care_links cl
    join public.professional_profiles pp on pp.user_id = cl.professional_id
    where cl.professional_id = (select auth.uid())
      and cl.patient_id = "assistant_conversations"."patient_id"
      and cl.ended_at is null
      and pp.status = 'verified'
  )));--> statement-breakpoint
CREATE POLICY "assistant_conversations_insert_own" ON "assistant_conversations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("assistant_conversations"."owner_id" = (select auth.uid()) and ("assistant_conversations"."mode" = 'personal' or exists (
    select 1 from public.care_links cl
    join public.professional_profiles pp on pp.user_id = cl.professional_id
    where cl.professional_id = (select auth.uid())
      and cl.patient_id = "assistant_conversations"."patient_id"
      and cl.ended_at is null
      and pp.status = 'verified'
  )));--> statement-breakpoint
CREATE POLICY "assistant_conversations_update_own" ON "assistant_conversations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("assistant_conversations"."owner_id" = (select auth.uid()) and ("assistant_conversations"."mode" = 'personal' or exists (
    select 1 from public.care_links cl
    join public.professional_profiles pp on pp.user_id = cl.professional_id
    where cl.professional_id = (select auth.uid())
      and cl.patient_id = "assistant_conversations"."patient_id"
      and cl.ended_at is null
      and pp.status = 'verified'
  ))) WITH CHECK ("assistant_conversations"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "assistant_conversations_delete_own" ON "assistant_conversations" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("assistant_conversations"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "assistant_messages_select_own" ON "assistant_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("assistant_messages"."owner_id" = (select auth.uid()) and exists (
        select 1 from public.assistant_conversations c where c.id = "assistant_messages"."conversation_id"
      ));--> statement-breakpoint
CREATE POLICY "assistant_messages_insert_own" ON "assistant_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("assistant_messages"."owner_id" = (select auth.uid()) and exists (
        select 1 from public.assistant_conversations c
        where c.id = "assistant_messages"."conversation_id" and c.owner_id = (select auth.uid())
      ));