ALTER POLICY "assessments_insert_own" ON "assessments" TO authenticated WITH CHECK ("assessments"."user_id" = (select auth.uid()) and public.current_account_type() = 'patient');--> statement-breakpoint
ALTER POLICY "care_links_insert_by_patient" ON "care_links" TO authenticated WITH CHECK ("care_links"."patient_id" = (select auth.uid())
        and "care_links"."ended_at" is null
        and public.current_account_type() = 'patient'
        and exists (
          select 1 from public.invitations i
          where i.id = "care_links"."invitation_id"
            and i.patient_id = (select auth.uid())
            and i.professional_id = "care_links"."professional_id"
            and i.status = 'accepted'
        ));--> statement-breakpoint
ALTER POLICY "check_in_addenda_insert_own" ON "check_in_addenda" TO authenticated WITH CHECK ("check_in_addenda"."user_id" = (select auth.uid())
        and public.current_account_type() = 'patient'
        and exists (
          select 1 from public.check_ins ci
          where ci.id = "check_in_addenda"."check_in_id"
            and ci.user_id = (select auth.uid())
        ));--> statement-breakpoint
ALTER POLICY "check_ins_insert_own" ON "check_ins" TO authenticated WITH CHECK ("check_ins"."user_id" = (select auth.uid()) and public.current_account_type() = 'patient');--> statement-breakpoint
ALTER POLICY "journal_entries_insert_own" ON "journal_entries" TO authenticated WITH CHECK ("journal_entries"."user_id" = (select auth.uid()) and public.current_account_type() = 'patient');--> statement-breakpoint
ALTER POLICY "professional_profiles_insert_own_pending" ON "professional_profiles" TO authenticated WITH CHECK ("professional_profiles"."user_id" = (select auth.uid())
        and "professional_profiles"."status" = 'pending'
        and "professional_profiles"."verified_at" is null
        and public.current_account_type() = 'professional');