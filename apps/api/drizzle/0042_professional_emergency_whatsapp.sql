ALTER TABLE "professional_profiles" ADD COLUMN "emergency_whatsapp" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_emergency_whatsapp_format" CHECK ("professional_profiles"."emergency_whatsapp" ~ '^\+[1-9][0-9]{7,14}$');--> statement-breakpoint
REVOKE SELECT ON public.professional_profiles FROM anon, authenticated;
--> statement-breakpoint
GRANT SELECT (user_id, kind, full_name, registration, status, created_at, verified_at, review_note, reviewed_at) ON public.professional_profiles TO anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (emergency_whatsapp) ON public.professional_profiles TO authenticated;
--> statement-breakpoint
CREATE FUNCTION public.own_emergency_whatsapp()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.emergency_whatsapp FROM public.professional_profiles p WHERE p.user_id = auth.uid()
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.own_emergency_whatsapp() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.own_emergency_whatsapp() TO authenticated;
--> statement-breakpoint
CREATE FUNCTION public.linked_professional_whatsapp()
RETURNS TABLE (professional_id uuid, emergency_whatsapp text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT cl.professional_id, p.emergency_whatsapp
  FROM public.care_links cl
  JOIN public.professional_profiles p ON p.user_id = cl.professional_id
  WHERE cl.patient_id = auth.uid() AND cl.ended_at IS NULL AND p.emergency_whatsapp IS NOT NULL
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.linked_professional_whatsapp() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.linked_professional_whatsapp() TO authenticated;
