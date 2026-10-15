CREATE OR REPLACE FUNCTION public.notify_invitation(p_invitation_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.notifications (user_id, kind, invitation_id)
  SELECT p_user_id, 'invitation', i.id
  FROM public.invitations i
  WHERE i.id = p_invitation_id
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n WHERE n.invitation_id = i.id AND n.user_id = p_user_id
    )
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.notify_invitation(uuid, uuid) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT u.raw_app_meta_data ->> 'role' = 'admin' FROM auth.users u WHERE u.id = auth.uid()),
    false
  )
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
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
  verified_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.user_id, p.kind, p.full_name, p.registration, u.email::text, p.status, p.created_at, p.verified_at
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
CREATE FUNCTION public.review_professional(p_user_id uuid, p_status public.professional_status)
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
      verified_at = CASE WHEN p_status = 'verified' THEN now() END
  WHERE user_id = p_user_id;
  RETURN FOUND;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.review_professional(uuid, public.professional_status) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.review_professional(uuid, public.professional_status) TO authenticated;
