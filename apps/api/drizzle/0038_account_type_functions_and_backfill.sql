CREATE FUNCTION public.current_account_type()
RETURNS public.account_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.account_type FROM public.profiles p WHERE p.id = auth.uid()
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.current_account_type() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.current_account_type() TO authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, locale, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'locale' IN ('pt-BR', 'pt-PT', 'en-US', 'en-GB')
        THEN NEW.raw_user_meta_data ->> 'locale'
    END,
    CASE
      WHEN NEW.raw_user_meta_data ->> 'account_type' = 'professional'
        THEN 'professional'::public.account_type
      ELSE 'patient'::public.account_type
    END
  );
  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE FUNCTION public.adopt_professional_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  UPDATE public.profiles p
  SET account_type = 'professional', updated_at = now()
  WHERE p.id = v_user
    AND p.account_type = 'patient'
    AND p.onboarding_completed_at IS NULL
    AND p.created_at BETWEEN now() - interval '1 hour' AND now()
    AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = v_user AND u.raw_user_meta_data ->> 'account_type' IS NULL
    )
    AND NOT EXISTS (SELECT 1 FROM public.consents c WHERE c.user_id = v_user)
    AND NOT EXISTS (SELECT 1 FROM public.check_ins c WHERE c.user_id = v_user)
    AND NOT EXISTS (SELECT 1 FROM public.assessments a WHERE a.user_id = v_user)
    AND NOT EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.user_id = v_user)
    AND NOT EXISTS (SELECT 1 FROM public.professional_profiles r WHERE r.user_id = v_user)
    AND NOT EXISTS (SELECT 1 FROM public.care_links l WHERE l.patient_id = v_user)
    AND NOT EXISTS (SELECT 1 FROM public.invitations i WHERE i.patient_id = v_user);
  RETURN FOUND;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.adopt_professional_account() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.adopt_professional_account() TO authenticated;
--> statement-breakpoint
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (display_name, avatar_path, timezone, locale, journal_in_insights, onboarding_completed_at, updated_at) ON public.profiles TO authenticated;
--> statement-breakpoint
UPDATE public.profiles p
SET account_type = 'professional'
WHERE EXISTS (SELECT 1 FROM public.professional_profiles r WHERE r.user_id = p.id)
  AND p.onboarding_completed_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.check_ins c WHERE c.user_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM public.assessments a WHERE a.user_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.user_id = p.id);
