REVOKE UPDATE, DELETE ON public.professional_documents FROM anon, authenticated;
--> statement-breakpoint
UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = 'avatars';
--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('professional-documents', 'professional-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
CREATE POLICY "professional_documents_objects_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'professional-documents' AND (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
CREATE POLICY "professional_documents_objects_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'professional-documents'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.user_id = (select auth.uid()) AND p.status <> 'verified'
  )
);
--> statement-breakpoint
CREATE POLICY "professional_documents_objects_delete_unsubmitted" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND NOT EXISTS (SELECT 1 FROM public.professional_documents d WHERE d.path = objects.name)
);
--> statement-breakpoint
DROP FUNCTION public.review_professional(uuid, public.professional_status);
--> statement-breakpoint
CREATE FUNCTION public.review_professional(
  p_user_id uuid,
  p_status public.professional_status,
  p_note text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() OR p_status = 'pending' THEN
    RETURN false;
  END IF;
  UPDATE public.professional_profiles
  SET status = p_status,
      verified_at = CASE WHEN p_status = 'verified' THEN now() END,
      review_note = nullif(trim(p_note), ''),
      reviewed_at = now()
  WHERE user_id = p_user_id;
  RETURN FOUND;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.review_professional(uuid, public.professional_status, text) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.review_professional(uuid, public.professional_status, text) TO authenticated;
--> statement-breakpoint
DROP FUNCTION public.professionals_for_review(public.professional_status);
--> statement-breakpoint
CREATE FUNCTION public.professionals_for_review(p_status public.professional_status)
RETURNS TABLE (
  user_id uuid,
  kind public.professional_kind,
  full_name text,
  registration text,
  email text,
  status public.professional_status,
  created_at timestamptz,
  verified_at timestamptz,
  review_note text,
  reviewed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.user_id, p.kind, p.full_name, p.registration, u.email::text, p.status, p.created_at,
         p.verified_at, p.review_note, p.reviewed_at
  FROM public.professional_profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE public.is_admin() AND p.status = p_status
  ORDER BY p.created_at
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.professionals_for_review(public.professional_status) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.professionals_for_review(public.professional_status) TO authenticated;
--> statement-breakpoint
CREATE FUNCTION public.reopen_professional_review()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.professional_profiles p
  SET status = 'pending', verified_at = NULL
  WHERE p.user_id = auth.uid()
    AND p.status = 'rejected'
    AND EXISTS (
      SELECT 1 FROM public.professional_documents d
      WHERE d.user_id = p.user_id AND d.created_at > coalesce(p.reviewed_at, '-infinity'::timestamptz)
    );
  RETURN FOUND;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.reopen_professional_review() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.reopen_professional_review() TO authenticated;
--> statement-breakpoint
CREATE FUNCTION public.linked_professional_avatars()
RETURNS TABLE (professional_id uuid, avatar_path text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT cl.professional_id, pr.avatar_path
  FROM public.care_links cl
  JOIN public.profiles pr ON pr.id = cl.professional_id
  WHERE cl.patient_id = auth.uid() AND cl.ended_at IS NULL AND pr.avatar_path IS NOT NULL
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.linked_professional_avatars() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.linked_professional_avatars() TO authenticated;
--> statement-breakpoint
DROP FUNCTION public.invitation_preview(text);
--> statement-breakpoint
CREATE FUNCTION public.invitation_preview(p_code text)
RETURNS TABLE (
  professional_name text,
  professional_kind public.professional_kind,
  status public.invitation_status,
  expires_at timestamptz,
  professional_avatar_path text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.full_name,
    p.kind,
    CASE WHEN i.status = 'pending' AND i.expires_at <= now() THEN 'expired'::public.invitation_status ELSE i.status END,
    i.expires_at,
    CASE WHEN i.status = 'pending' AND i.expires_at > now() THEN pr.avatar_path END
  FROM public.invitations i
  JOIN public.professional_profiles p ON p.user_id = i.professional_id
  LEFT JOIN public.profiles pr ON pr.id = i.professional_id
  WHERE i.code = upper(trim(p_code))
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.invitation_preview(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.invitation_preview(text) TO anon, authenticated;
