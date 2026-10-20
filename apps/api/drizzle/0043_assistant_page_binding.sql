ALTER TABLE "assistant_conversations" ADD COLUMN "journal_entry_id" uuid;--> statement-breakpoint
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_page_personal" CHECK ("assistant_conversations"."journal_entry_id" is null or "assistant_conversations"."mode" = 'personal');--> statement-breakpoint
ALTER POLICY "assistant_conversations_insert_own" ON "assistant_conversations" TO authenticated WITH CHECK ("assistant_conversations"."owner_id" = (select auth.uid()) and ("assistant_conversations"."mode" = 'personal' or exists (
    select 1 from public.care_links cl
    join public.professional_profiles pp on pp.user_id = cl.professional_id
    where cl.professional_id = (select auth.uid())
      and cl.patient_id = "assistant_conversations"."patient_id"
      and cl.ended_at is null
      and pp.status = 'verified'
  ))
        and ("assistant_conversations"."journal_entry_id" is null or exists (
          select 1 from public.journal_entries e
          where e.id = "assistant_conversations"."journal_entry_id" and e.user_id = (select auth.uid())
        )));