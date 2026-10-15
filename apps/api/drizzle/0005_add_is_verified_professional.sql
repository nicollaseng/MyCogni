CREATE FUNCTION public.is_verified_professional()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.user_id = auth.uid() AND p.status = 'verified'
  );
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.is_verified_professional() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.is_verified_professional() TO authenticated;
