REVOKE UPDATE ON public.journal_entries FROM anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (title, body, plain_text, image_paths, updated_at) ON public.journal_entries TO authenticated;
--> statement-breakpoint
REVOKE UPDATE ON public.journal_shares FROM anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (revoked_at) ON public.journal_shares TO authenticated;
--> statement-breakpoint
REVOKE UPDATE, DELETE ON public.journal_share_entries FROM anon, authenticated;
--> statement-breakpoint
REVOKE UPDATE, DELETE ON public.journal_access_log FROM anon, authenticated;
--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('journal', 'journal', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
CREATE POLICY "journal_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'journal' AND (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
CREATE POLICY "journal_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'journal' AND (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
CREATE POLICY "journal_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'journal' AND (storage.foldername(name))[1] = (select auth.uid())::text);
