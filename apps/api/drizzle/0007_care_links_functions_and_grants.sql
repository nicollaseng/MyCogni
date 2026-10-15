REVOKE UPDATE ON public.invitations FROM anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (status, responded_at) ON public.invitations TO authenticated;
--> statement-breakpoint
REVOKE UPDATE ON public.care_links FROM anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (ended_at, ended_by) ON public.care_links TO authenticated;
--> statement-breakpoint
REVOKE UPDATE ON public.notifications FROM anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
--> statement-breakpoint
REVOKE UPDATE ON public.professional_profiles FROM anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION public.invitation_preview(p_code text)
RETURNS TABLE (
  professional_name text,
  professional_kind public.professional_kind,
  status public.invitation_status,
  expires_at timestamptz
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
    i.expires_at
  FROM public.invitations i
  JOIN public.professional_profiles p ON p.user_id = i.professional_id
  WHERE i.code = upper(trim(p_code))
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.invitation_preview(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.invitation_preview(text) TO anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION public.notify_invitation(p_invitation_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.notifications (user_id, kind, title, href, invitation_id)
  SELECT p_user_id, 'invitation', p.full_name || ' convidou você para acompanhar seus registros', '/invites', i.id
  FROM public.invitations i
  JOIN public.professional_profiles p ON p.user_id = i.professional_id
  WHERE i.id = p_invitation_id
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n WHERE n.invitation_id = i.id AND n.user_id = p_user_id
    )
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.notify_invitation(uuid, uuid) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION public.claim_invitation(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN NULL;
  END IF;
  UPDATE public.invitations
  SET patient_id = v_user
  WHERE code = upper(trim(p_code))
    AND status = 'pending'
    AND expires_at > now()
    AND professional_id <> v_user
    AND (patient_id IS NULL OR patient_id = v_user)
  RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN
    PERFORM public.notify_invitation(v_id, v_user);
  END IF;
  RETURN v_id;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.claim_invitation(text) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.claim_invitation(text) TO authenticated;
--> statement-breakpoint
CREATE FUNCTION public.attach_invitations_by_email()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_id uuid;
  v_count integer := 0;
BEGIN
  SELECT lower(u.email) INTO v_email
  FROM auth.users u
  WHERE u.id = v_user AND u.email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN
    RETURN 0;
  END IF;
  FOR v_id IN
    UPDATE public.invitations
    SET patient_id = v_user
    WHERE lower(recipient_email) = v_email
      AND patient_id IS NULL
      AND status = 'pending'
      AND expires_at > now()
      AND professional_id <> v_user
    RETURNING id
  LOOP
    PERFORM public.notify_invitation(v_id, v_user);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.attach_invitations_by_email() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.attach_invitations_by_email() TO authenticated;
