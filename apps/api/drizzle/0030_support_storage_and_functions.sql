REVOKE UPDATE, DELETE ON public.support_tickets FROM anon, authenticated;
--> statement-breakpoint
REVOKE INSERT ON public.support_tickets FROM anon;
--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('support-attachments', 'support-attachments', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'])
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
CREATE POLICY "support_attachments_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
CREATE POLICY "support_attachments_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
CREATE POLICY "support_attachments_delete_unsent" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND NOT EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.attachment_path = objects.name)
);
--> statement-breakpoint
CREATE FUNCTION public.change_support_ticket_status(
  p_ticket_id uuid,
  p_status public.support_ticket_status,
  p_note text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_status public.support_ticket_status;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN 'forbidden';
  END IF;
  SELECT t.user_id, t.status INTO v_user_id, v_status
  FROM public.support_tickets t
  WHERE t.id = p_ticket_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;
  IF NOT (
    (v_status = 'pending' AND p_status IN ('in_progress', 'closed'))
    OR (v_status = 'in_progress' AND p_status = 'closed')
  ) THEN
    RETURN 'invalid_transition';
  END IF;
  UPDATE public.support_tickets
  SET status = p_status,
      taken_at = CASE WHEN p_status = 'in_progress' THEN now() ELSE taken_at END,
      taken_by = CASE WHEN p_status = 'in_progress' THEN auth.uid() ELSE taken_by END,
      closed_at = CASE WHEN p_status = 'closed' THEN now() ELSE closed_at END,
      closed_by = CASE WHEN p_status = 'closed' THEN auth.uid() ELSE closed_by END,
      closing_note = CASE WHEN p_status = 'closed' THEN nullif(trim(p_note), '') ELSE closing_note END
  WHERE id = p_ticket_id;
  INSERT INTO public.notifications (user_id, kind, support_ticket_id, support_status)
  VALUES (v_user_id, 'support', p_ticket_id, p_status);
  RETURN 'changed';
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.change_support_ticket_status(uuid, public.support_ticket_status, text) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.change_support_ticket_status(uuid, public.support_ticket_status, text) TO authenticated;
--> statement-breakpoint
CREATE FUNCTION public.support_tickets_for_admin(
  p_status public.support_ticket_status DEFAULT NULL,
  p_ticket_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  number integer,
  requester_role public.support_requester_role,
  subject public.support_subject,
  custom_subject text,
  message text,
  attachment_name text,
  attachment_type text,
  attachment_size integer,
  status public.support_ticket_status,
  locale text,
  closing_note text,
  created_at timestamptz,
  taken_at timestamptz,
  closed_at timestamptz,
  requester_name text,
  requester_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT t.id, t.number, t.requester_role, t.subject, t.custom_subject, t.message,
         t.attachment_name, t.attachment_type, t.attachment_size, t.status, t.locale,
         t.closing_note, t.created_at, t.taken_at, t.closed_at,
         CASE WHEN t.requester_role = 'professional'
              THEN coalesce(pp.full_name, pr.display_name)
              ELSE coalesce(pr.display_name, pp.full_name)
         END,
         u.email::text
  FROM public.support_tickets t
  JOIN auth.users u ON u.id = t.user_id
  LEFT JOIN public.profiles pr ON pr.id = t.user_id
  LEFT JOIN public.professional_profiles pp ON pp.user_id = t.user_id
  WHERE public.is_admin()
    AND (p_status IS NULL OR t.status = p_status)
    AND (p_ticket_id IS NULL OR t.id = p_ticket_id)
  ORDER BY t.created_at DESC
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.support_tickets_for_admin(public.support_ticket_status, uuid) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.support_tickets_for_admin(public.support_ticket_status, uuid) TO authenticated;
