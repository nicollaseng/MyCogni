DO $$
BEGIN
  CREATE TYPE "public"."professional_council" AS ENUM('crp', 'crm');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;--> statement-breakpoint
ALTER TYPE "public"."care_link_ended_by" ADD VALUE IF NOT EXISTS 'team';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professional_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"admin_id" uuid,
	"decision" "professional_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_reviews_decision" CHECK ("professional_reviews"."decision" <> 'pending'),
	CONSTRAINT "professional_reviews_note_length" CHECK (char_length("professional_reviews"."note") <= 500)
);--> statement-breakpoint
ALTER TABLE "professional_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "professional_review_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "care_link_id" uuid;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN IF NOT EXISTS "registration_council" "professional_council";--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN IF NOT EXISTS "registration_uf" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN IF NOT EXISTS "registration_number" text;--> statement-breakpoint
ALTER TABLE "professional_reviews" DROP CONSTRAINT IF EXISTS "professional_reviews_professional_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_reviews" DROP CONSTRAINT IF EXISTS "professional_reviews_admin_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "professional_reviews" ADD CONSTRAINT "professional_reviews_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_professional_review_id_professional_reviews_id_fk";--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_professional_review_id_professional_reviews_id_fk" FOREIGN KEY ("professional_review_id") REFERENCES "public"."professional_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_care_link_id_care_links_id_fk";--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_care_link_id_care_links_id_fk" FOREIGN KEY ("care_link_id") REFERENCES "public"."care_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "professional_reviews_professional_created_idx" ON "professional_reviews" USING btree ("professional_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.registration_scope(p_council public.professional_council, p_uf text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_council::text = 'crp' THEN CASE p_uf WHEN 'AC' THEN '24' WHEN 'AL' THEN '15' WHEN 'AP' THEN '10' WHEN 'AM' THEN '20' WHEN 'BA' THEN '03' WHEN 'CE' THEN '11' WHEN 'DF' THEN '01' WHEN 'ES' THEN '16' WHEN 'GO' THEN '09' WHEN 'MA' THEN '22' WHEN 'MT' THEN '18' WHEN 'MS' THEN '14' WHEN 'MG' THEN '04' WHEN 'PA' THEN '10' WHEN 'PB' THEN '13' WHEN 'PR' THEN '08' WHEN 'PE' THEN '02' WHEN 'PI' THEN '21' WHEN 'RJ' THEN '05' WHEN 'RN' THEN '17' WHEN 'RS' THEN '07' WHEN 'RO' THEN '24' WHEN 'RR' THEN '20' WHEN 'SC' THEN '12' WHEN 'SP' THEN '06' WHEN 'SE' THEN '19' WHEN 'TO' THEN '23' END
    ELSE p_uf
  END
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.registration_scope(public.professional_council, text) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.registration_scope(public.professional_council, text) TO authenticated;--> statement-breakpoint
WITH normalized AS (
  SELECT p.user_id, p.kind, p.status, p.created_at,
         btrim(regexp_replace(regexp_replace(upper(p.registration), '[.:]', '', 'g'), '\s+', ' ', 'g')) AS text
  FROM public.professional_profiles p
  WHERE p.registration_council IS NULL
    AND p.registration IS NOT NULL
    AND p.kind <> 'psychoanalyst'
),
crp AS (
  SELECT n.user_id, n.status, n.created_at, 'crp'::public.professional_council AS council,
         (
           SELECT min(s.uf)
           FROM unnest(ARRAY['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']) AS s(uf)
           WHERE public.registration_scope('crp', s.uf) = lpad(m[1], 2, '0')
           HAVING count(*) = 1
         ) AS uf,
         m[2] AS number
  FROM normalized n
  CROSS JOIN LATERAL regexp_match(n.text, '^(?:CRP)?[ /-]*([0-9]{1,2}) ?[/ -] ?([0-9]{4,8})$') AS m
  WHERE n.kind = 'psychologist'
),
crm AS (
  SELECT n.user_id, n.status, n.created_at, 'crm'::public.professional_council AS council,
         coalesce(a[1], b[2]) AS uf,
         coalesce(a[2], b[1]) AS number
  FROM normalized n
  LEFT JOIN LATERAL regexp_match(n.text, '^(?:CRM)?[ /-]*([A-Z]{2})[ /-]*([0-9]{4,8})$') AS a ON true
  LEFT JOIN LATERAL regexp_match(n.text, '^(?:CRM)?[ /-]*([0-9]{4,8})[ /-]*([A-Z]{2})$') AS b ON true
  WHERE n.kind IN ('psychiatrist', 'physician')
),
candidates AS (
  SELECT * FROM crp WHERE uf IS NOT NULL
  UNION ALL
  SELECT * FROM crm WHERE uf = ANY (ARRAY['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']) AND number IS NOT NULL
),
ranked AS (
  SELECT c.*,
         row_number() OVER (
           PARTITION BY c.council, public.registration_scope(c.council, c.uf), ltrim(c.number, '0'), c.status = 'rejected'
           ORDER BY c.status = 'verified' DESC, c.created_at, c.user_id
         ) AS position
  FROM candidates c
)
UPDATE public.professional_profiles p
SET registration_council = r.council, registration_uf = r.uf, registration_number = r.number
FROM ranked r
WHERE p.user_id = r.user_id
  AND (
    r.status = 'rejected'
    OR (
      r.position = 1
      AND NOT EXISTS (
        SELECT 1 FROM public.professional_profiles o
        WHERE o.status <> 'rejected'
          AND o.registration_council = r.council
          AND public.registration_scope(o.registration_council, o.registration_uf) = public.registration_scope(r.council, r.uf)
          AND ltrim(o.registration_number, '0') = ltrim(r.number, '0')
      )
    )
  );--> statement-breakpoint
ALTER TABLE "professional_profiles" DROP CONSTRAINT IF EXISTS "professional_profiles_registration_uf";--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_registration_uf" CHECK ("professional_profiles"."registration_uf" in ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'));--> statement-breakpoint
ALTER TABLE "professional_profiles" DROP CONSTRAINT IF EXISTS "professional_profiles_registration_number";--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_registration_number" CHECK ("professional_profiles"."registration_number" ~ '^[0-9]{4,8}$');--> statement-breakpoint
ALTER TABLE "professional_profiles" DROP CONSTRAINT IF EXISTS "professional_profiles_registration_parts";--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_registration_parts" CHECK (("professional_profiles"."registration_council" is null) = ("professional_profiles"."registration_uf" is null)
        and ("professional_profiles"."registration_council" is null) = ("professional_profiles"."registration_number" is null));--> statement-breakpoint
ALTER TABLE "professional_profiles" DROP CONSTRAINT IF EXISTS "professional_profiles_registration_council";--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_registration_council" CHECK ("professional_profiles"."registration_council" is null
        or ("professional_profiles"."registration_council" = 'crp' and "professional_profiles"."kind" = 'psychologist')
        or ("professional_profiles"."registration_council" = 'crm' and "professional_profiles"."kind" in ('psychiatrist', 'physician')));--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "professional_profiles_registration_key" ON "professional_profiles" USING btree ("registration_council",public.registration_scope(registration_council, registration_uf),ltrim(registration_number, '0')) WHERE status <> 'rejected' and registration_council is not null;--> statement-breakpoint
GRANT SELECT (registration_council, registration_uf, registration_number) ON public.professional_profiles TO anon, authenticated;--> statement-breakpoint
REVOKE ALL ON public.professional_reviews FROM anon, authenticated;--> statement-breakpoint
GRANT SELECT ON public.professional_reviews TO authenticated;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_verified_professional_id(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.user_id = p_user_id AND p.status = 'verified'
  )
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.is_verified_professional_id(uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.is_verified_professional_id(uuid) TO authenticated;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.locked_identity()
RETURNS TABLE (full_name text, avatar_path text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.full_name, pr.avatar_path
  FROM public.professional_profiles p
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.user_id = auth.uid() AND p.status = 'verified'
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.locked_identity() FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.locked_identity() TO authenticated;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.review_professional(
  p_user_id uuid,
  p_status public.professional_status,
  p_note text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_previous public.professional_status;
  v_note text := nullif(trim(p_note), '');
  v_review uuid;
BEGIN
  IF NOT public.is_admin() OR p_status = 'pending' THEN
    RETURN false;
  END IF;
  SELECT p.status INTO v_previous
  FROM public.professional_profiles p
  WHERE p.user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  UPDATE public.professional_profiles
  SET status = p_status,
      verified_at = CASE WHEN p_status = 'verified' THEN now() END,
      review_note = v_note,
      reviewed_at = now()
  WHERE user_id = p_user_id;
  INSERT INTO public.professional_reviews (professional_id, admin_id, decision, note)
  VALUES (p_user_id, auth.uid(), p_status, v_note)
  RETURNING id INTO v_review;
  IF v_previous <> p_status THEN
    INSERT INTO public.notifications (user_id, kind, professional_review_id)
    VALUES (p_user_id, 'professional', v_review);
  END IF;
  IF v_previous = 'verified' AND p_status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, kind, care_link_id)
    SELECT cl.patient_id, 'professional', cl.id
    FROM public.care_links cl
    WHERE cl.professional_id = p_user_id AND cl.ended_at IS NULL;
    UPDATE public.care_links
    SET ended_at = now(), ended_by = 'team'
    WHERE professional_id = p_user_id AND ended_at IS NULL;
    UPDATE public.invitations
    SET status = 'canceled', responded_at = now()
    WHERE professional_id = p_user_id AND status = 'pending';
  END IF;
  RETURN true;
END;
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.review_professional(uuid, public.professional_status, text) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.review_professional(uuid, public.professional_status, text) TO authenticated;--> statement-breakpoint
DROP FUNCTION IF EXISTS public.professionals_for_review(public.professional_status);--> statement-breakpoint
DROP FUNCTION IF EXISTS public.professionals_for_review(public.professional_status, uuid);--> statement-breakpoint
CREATE FUNCTION public.professionals_for_review(
  p_status public.professional_status,
  p_user_id uuid DEFAULT NULL
)
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
  reviewed_at timestamptz,
  registration_council public.professional_council,
  registration_uf text,
  registration_number text,
  avatar_path text,
  locale text,
  active_links integer,
  pending_invitations integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.user_id, p.kind, p.full_name, p.registration, u.email::text, p.status, p.created_at,
         p.verified_at, p.review_note, p.reviewed_at, p.registration_council, p.registration_uf,
         p.registration_number, pr.avatar_path, pr.locale,
         (
           SELECT count(*)::integer FROM public.care_links cl
           WHERE cl.professional_id = p.user_id AND cl.ended_at IS NULL
         ),
         (
           SELECT count(*)::integer FROM public.invitations i
           WHERE i.professional_id = p.user_id AND i.status = 'pending' AND i.expires_at > now()
         )
  FROM public.professional_profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE public.is_admin()
    AND (p_status IS NULL OR p.status = p_status)
    AND (p_user_id IS NULL OR p.user_id = p_user_id)
  ORDER BY p.created_at
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.professionals_for_review(public.professional_status, uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.professionals_for_review(public.professional_status, uuid) TO authenticated;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.professional_review_history(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  decision public.professional_status,
  note text,
  admin_email text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT r.id, r.decision, r.note, u.email::text, r.created_at
  FROM public.professional_reviews r
  LEFT JOIN auth.users u ON u.id = r.admin_id
  WHERE public.is_admin() AND r.professional_id = p_user_id
  ORDER BY r.created_at DESC
$$;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.professional_review_history(uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.professional_review_history(uuid) TO authenticated;--> statement-breakpoint
DROP POLICY IF EXISTS "professional_reviews_select_admin" ON "professional_reviews";--> statement-breakpoint
CREATE POLICY "professional_reviews_select_admin" ON "professional_reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());--> statement-breakpoint
DROP POLICY IF EXISTS "professional_reviews_select_own" ON "professional_reviews";--> statement-breakpoint
CREATE POLICY "professional_reviews_select_own" ON "professional_reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("professional_reviews"."professional_id" = (select auth.uid()));--> statement-breakpoint
ALTER POLICY "care_links_insert_by_patient" ON "care_links" TO authenticated WITH CHECK ("care_links"."patient_id" = (select auth.uid())
        and "care_links"."ended_at" is null
        and public.current_account_type() = 'patient'
        and exists (
          select 1 from public.invitations i
          where i.id = "care_links"."invitation_id"
            and i.patient_id = (select auth.uid())
            and i.professional_id = "care_links"."professional_id"
            and i.status = 'accepted'
        )
        and public.is_verified_professional_id("care_links"."professional_id"));--> statement-breakpoint
ALTER POLICY "professional_profiles_update_own_name" ON "professional_profiles" TO authenticated USING ("professional_profiles"."user_id" = (select auth.uid())) WITH CHECK ("professional_profiles"."user_id" = (select auth.uid())
        and not exists (
          select 1 from public.locked_identity() l
          where l.full_name is distinct from "professional_profiles"."full_name"
        ));--> statement-breakpoint
ALTER POLICY "profiles_update_own" ON "profiles" TO authenticated USING ("profiles"."id" = (select auth.uid())) WITH CHECK ("profiles"."id" = (select auth.uid())
        and not exists (
          select 1 from public.locked_identity() l
          where l.avatar_path is distinct from "profiles"."avatar_path"
        ));--> statement-breakpoint
ALTER POLICY "avatars_update_own" ON storage.objects
USING (bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND NOT EXISTS (SELECT 1 FROM public.locked_identity() l WHERE l.avatar_path = objects.name))
WITH CHECK (bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND NOT EXISTS (SELECT 1 FROM public.locked_identity() l WHERE l.avatar_path = objects.name));--> statement-breakpoint
ALTER POLICY "avatars_delete_own" ON storage.objects
USING (bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND NOT EXISTS (SELECT 1 FROM public.locked_identity() l WHERE l.avatar_path = objects.name));
