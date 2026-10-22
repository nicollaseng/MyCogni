CREATE TYPE "public"."memory_kind" AS ENUM('fact', 'routine', 'preference', 'goal', 'trigger', 'coping', 'relationship', 'event');--> statement-breakpoint
CREATE TYPE "public"."memory_origin" AS ENUM('extracted', 'manual');--> statement-breakpoint
CREATE TYPE "public"."memory_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "assistant_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"kind" "memory_kind" NOT NULL,
	"origin" "memory_origin" NOT NULL,
	"importance" smallint DEFAULT 2 NOT NULL,
	"status" "memory_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "assistant_memories_content_length" CHECK (char_length("assistant_memories"."content") between 1 and 280),
	CONSTRAINT "assistant_memories_importance" CHECK ("assistant_memories"."importance" between 1 and 3)
);
--> statement-breakpoint
ALTER TABLE "assistant_memories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assistant_memory_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"check_in_id" uuid,
	"check_in_addendum_id" uuid,
	"journal_entry_id" uuid,
	"assistant_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_memory_sources_unique" UNIQUE NULLS NOT DISTINCT("memory_id","check_in_id","check_in_addendum_id","journal_entry_id","assistant_message_id"),
	CONSTRAINT "assistant_memory_sources_one_source" CHECK (num_nonnulls("assistant_memory_sources"."check_in_id", "assistant_memory_sources"."check_in_addendum_id", "assistant_memory_sources"."journal_entry_id", "assistant_memory_sources"."assistant_message_id") = 1)
);
--> statement-breakpoint
ALTER TABLE "assistant_memory_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "memories_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "memories_read_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assistant_memories" ADD CONSTRAINT "assistant_memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_memory_sources" ADD CONSTRAINT "assistant_memory_sources_memory_id_assistant_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."assistant_memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_memory_sources" ADD CONSTRAINT "assistant_memory_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_memory_sources" ADD CONSTRAINT "assistant_memory_sources_check_in_id_check_ins_id_fk" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_memory_sources" ADD CONSTRAINT "assistant_memory_sources_check_in_addendum_id_check_in_addenda_id_fk" FOREIGN KEY ("check_in_addendum_id") REFERENCES "public"."check_in_addenda"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_memory_sources" ADD CONSTRAINT "assistant_memory_sources_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_memory_sources" ADD CONSTRAINT "assistant_memory_sources_assistant_message_id_assistant_messages_id_fk" FOREIGN KEY ("assistant_message_id") REFERENCES "public"."assistant_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assistant_memories_user_idx" ON "assistant_memories" USING btree ("user_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "assistant_memory_sources_memory_idx" ON "assistant_memory_sources" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX "assistant_memory_sources_check_in_idx" ON "assistant_memory_sources" USING btree ("check_in_id");--> statement-breakpoint
CREATE INDEX "assistant_memory_sources_addendum_idx" ON "assistant_memory_sources" USING btree ("check_in_addendum_id");--> statement-breakpoint
CREATE INDEX "assistant_memory_sources_journal_idx" ON "assistant_memory_sources" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "assistant_memory_sources_message_idx" ON "assistant_memory_sources" USING btree ("assistant_message_id");--> statement-breakpoint
CREATE POLICY "assistant_memories_select_own" ON "assistant_memories" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("assistant_memories"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "assistant_memories_insert_own" ON "assistant_memories" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("assistant_memories"."user_id" = (select auth.uid()) and public.current_account_type() = 'patient');--> statement-breakpoint
CREATE POLICY "assistant_memories_update_own" ON "assistant_memories" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("assistant_memories"."user_id" = (select auth.uid())) WITH CHECK ("assistant_memories"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "assistant_memories_delete_own" ON "assistant_memories" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("assistant_memories"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "assistant_memory_sources_select_own" ON "assistant_memory_sources" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("assistant_memory_sources"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "assistant_memory_sources_insert_own" ON "assistant_memory_sources" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("assistant_memory_sources"."user_id" = (select auth.uid())
        and exists (
          select 1 from public.assistant_memories m
          where m.id = "assistant_memory_sources"."memory_id" and m.user_id = (select auth.uid())
        )
        and ("assistant_memory_sources"."check_in_id" is null or exists (
          select 1 from public.check_ins ci
          where ci.id = "assistant_memory_sources"."check_in_id" and ci.user_id = (select auth.uid())
        ))
        and ("assistant_memory_sources"."check_in_addendum_id" is null or exists (
          select 1 from public.check_in_addenda ad
          where ad.id = "assistant_memory_sources"."check_in_addendum_id" and ad.user_id = (select auth.uid())
        ))
        and ("assistant_memory_sources"."journal_entry_id" is null or exists (
          select 1 from public.journal_entries e
          where e.id = "assistant_memory_sources"."journal_entry_id" and e.user_id = (select auth.uid())
        ))
        and ("assistant_memory_sources"."assistant_message_id" is null or exists (
          select 1 from public.assistant_messages am
          join public.assistant_conversations c on c.id = am.conversation_id
          where am.id = "assistant_memory_sources"."assistant_message_id"
            and am.owner_id = (select auth.uid())
            and c.mode = 'personal'
        )));--> statement-breakpoint
CREATE POLICY "assistant_memory_sources_delete_own" ON "assistant_memory_sources" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("assistant_memory_sources"."user_id" = (select auth.uid()));--> statement-breakpoint
REVOKE ALL ON public.assistant_memories FROM anon;
--> statement-breakpoint
REVOKE ALL ON public.assistant_memory_sources FROM anon;
--> statement-breakpoint
REVOKE UPDATE, TRUNCATE ON public.assistant_memories FROM authenticated;
--> statement-breakpoint
GRANT UPDATE (content, kind, importance, status, updated_at, last_used_at) ON public.assistant_memories TO authenticated;
--> statement-breakpoint
REVOKE UPDATE, TRUNCATE ON public.assistant_memory_sources FROM authenticated;
--> statement-breakpoint
GRANT UPDATE (memories_enabled, memories_read_until) ON public.profiles TO authenticated;
--> statement-breakpoint
CREATE FUNCTION public.forget_unsourced_memory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.assistant_memories m
  WHERE m.id = OLD.memory_id
    AND m.origin = 'extracted'
    AND NOT EXISTS (
      SELECT 1 FROM public.assistant_memory_sources s WHERE s.memory_id = OLD.memory_id
    );
  RETURN NULL;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.forget_unsourced_memory() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER assistant_memory_sources_forget
AFTER DELETE ON public.assistant_memory_sources
FOR EACH ROW EXECUTE FUNCTION public.forget_unsourced_memory();
