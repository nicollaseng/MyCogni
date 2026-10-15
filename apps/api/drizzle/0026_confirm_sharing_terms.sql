UPDATE public.care_links SET consent_accepted_at = started_at;
--> statement-breakpoint
CREATE FUNCTION public.confirm_sharing_terms(p_link_id uuid, p_version text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.care_links
  SET consent_version = p_version,
      consent_accepted_at = now()
  WHERE id = p_link_id
    AND patient_id = auth.uid()
    AND ended_at IS NULL
    AND char_length(p_version) BETWEEN 1 AND 32;
  RETURN FOUND;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.confirm_sharing_terms(uuid, text) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.confirm_sharing_terms(uuid, text) TO authenticated;
