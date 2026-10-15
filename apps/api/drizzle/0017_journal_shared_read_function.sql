CREATE FUNCTION public.can_read_shared_journal_entry(p_entry_id uuid, p_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.journal_shares s
    JOIN public.care_links cl ON cl.id = s.care_link_id
    WHERE s.patient_id = p_owner_id
      AND s.professional_id = auth.uid()
      AND s.revoked_at IS NULL
      AND (s.expires_at IS NULL OR s.expires_at > now())
      AND cl.ended_at IS NULL
      AND (
        s.scope = 'all'
        OR EXISTS (
          SELECT 1 FROM public.journal_share_entries se
          WHERE se.share_id = s.id AND se.entry_id = p_entry_id
        )
      )
  );
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.can_read_shared_journal_entry(uuid, uuid) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.can_read_shared_journal_entry(uuid, uuid) TO authenticated;
