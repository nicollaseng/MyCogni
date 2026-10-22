DO $$ BEGIN
  CREATE TYPE "public"."zen_session_kind" AS ENUM('meditation', 'breathing', 'sound', 'reading');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zen_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "zen_session_kind" NOT NULL,
	"content_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"seconds_completed" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"feeling_after" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zen_sessions_content_length" CHECK (char_length("zen_sessions"."content_id") <= 60),
	CONSTRAINT "zen_sessions_seconds_range" CHECK ("zen_sessions"."seconds_completed" between 0 and 14400),
	CONSTRAINT "zen_sessions_feeling_range" CHECK ("zen_sessions"."feeling_after" is null or "zen_sessions"."feeling_after" between 0 and 6)
);
--> statement-breakpoint
ALTER TABLE "zen_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "zen_sessions" ADD CONSTRAINT "zen_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "zen_sessions_user_started_idx" ON "zen_sessions" USING btree ("user_id","started_at" DESC NULLS LAST);--> statement-breakpoint
DROP POLICY IF EXISTS "zen_sessions_select_own" ON "zen_sessions";--> statement-breakpoint
CREATE POLICY "zen_sessions_select_own" ON "zen_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("zen_sessions"."user_id" = (select auth.uid()));--> statement-breakpoint
DROP POLICY IF EXISTS "zen_sessions_insert_own" ON "zen_sessions";--> statement-breakpoint
CREATE POLICY "zen_sessions_insert_own" ON "zen_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("zen_sessions"."user_id" = (select auth.uid()) and public.current_account_type() = 'patient');--> statement-breakpoint
DROP POLICY IF EXISTS "zen_sessions_update_own" ON "zen_sessions";--> statement-breakpoint
CREATE POLICY "zen_sessions_update_own" ON "zen_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("zen_sessions"."user_id" = (select auth.uid())) WITH CHECK ("zen_sessions"."user_id" = (select auth.uid()));--> statement-breakpoint
REVOKE ALL ON public.zen_sessions FROM anon;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON public.zen_sessions FROM authenticated;
--> statement-breakpoint
GRANT UPDATE (feeling_after) ON public.zen_sessions TO authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.zen_practice_stats()
RETURNS TABLE (
  kind text,
  content_id text,
  people integer,
  starts integer,
  completions integer,
  median_seconds integer,
  compared_people integer,
  better integer,
  same integer,
  worse integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH sessions AS (
    SELECT
      s.user_id,
      s.kind::text AS kind,
      s.content_id,
      s.seconds_completed,
      s.completed,
      s.feeling_after,
      (s.started_at AT TIME ZONE coalesce(p.timezone, 'UTC'))::date AS day
    FROM public.zen_sessions s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    WHERE public.is_admin()
  ),
  daily AS (
    SELECT
      c.user_id,
      (c.recorded_at AT TIME ZONE coalesce(p.timezone, 'UTC'))::date AS day,
      avg(c.mood_level) AS mood
    FROM public.check_ins c
    LEFT JOIN public.profiles p ON p.id = c.user_id
    WHERE public.is_admin()
    GROUP BY 1, 2
  ),
  compared AS (
    SELECT
      s.kind,
      s.content_id,
      s.user_id,
      CASE
        WHEN s.feeling_after > d.mood + 0.5 THEN 'better'
        WHEN s.feeling_after < d.mood - 0.5 THEN 'worse'
        ELSE 'same'
      END AS outcome
    FROM sessions s
    JOIN daily d ON d.user_id = s.user_id AND d.day = s.day
    WHERE s.feeling_after IS NOT NULL
  ),
  totals AS (
    SELECT
      kind,
      content_id,
      count(DISTINCT user_id)::integer AS people,
      count(*)::integer AS starts,
      (count(*) FILTER (WHERE completed))::integer AS completions,
      (percentile_cont(0.5) WITHIN GROUP (ORDER BY seconds_completed))::integer AS median_seconds
    FROM sessions
    GROUP BY kind, content_id
  ),
  feelings AS (
    SELECT
      kind,
      content_id,
      count(DISTINCT user_id)::integer AS compared_people,
      (count(*) FILTER (WHERE outcome = 'better'))::integer AS better,
      (count(*) FILTER (WHERE outcome = 'same'))::integer AS same,
      (count(*) FILTER (WHERE outcome = 'worse'))::integer AS worse
    FROM compared
    GROUP BY kind, content_id
  )
  SELECT
    t.kind,
    t.content_id,
    CASE WHEN t.people >= 5 THEN t.people END,
    CASE WHEN t.people >= 5 THEN t.starts END,
    CASE WHEN t.people >= 5 THEN t.completions END,
    CASE WHEN t.people >= 5 THEN t.median_seconds END,
    CASE WHEN f.compared_people >= 5 THEN f.compared_people END,
    CASE WHEN f.compared_people >= 5 THEN f.better END,
    CASE WHEN f.compared_people >= 5 THEN f.same END,
    CASE WHEN f.compared_people >= 5 THEN f.worse END
  FROM totals t
  LEFT JOIN feelings f ON f.kind = t.kind AND f.content_id = t.content_id
  ORDER BY t.kind, t.content_id
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.zen_practice_stats() FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.zen_practice_stats() TO authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.zen_track_stats(p_tracks jsonb)
RETURNS TABLE (
  track_id text,
  people integer,
  completions integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH steps AS (
    SELECT t.key AS track_id, s.step_id
    FROM jsonb_each(p_tracks) t
    CROSS JOIN LATERAL jsonb_array_elements_text(t.value) AS s(step_id)
  ),
  expected AS (
    SELECT track_id, count(*) AS total FROM steps GROUP BY track_id
  ),
  people AS (
    SELECT z.track_id, z.user_id, count(*) AS done
    FROM public.zen_step_progress z
    JOIN steps s ON s.track_id = z.track_id AND s.step_id = z.step_id
    WHERE public.is_admin()
    GROUP BY z.track_id, z.user_id
  ),
  totals AS (
    SELECT
      p.track_id,
      count(*)::integer AS people,
      (count(*) FILTER (WHERE p.done = e.total))::integer AS completions
    FROM people p
    JOIN expected e ON e.track_id = p.track_id
    GROUP BY p.track_id
  )
  SELECT
    track_id,
    CASE WHEN people >= 5 THEN people END,
    CASE WHEN people >= 5 THEN completions END
  FROM totals
  ORDER BY track_id
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.zen_track_stats(jsonb) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.zen_track_stats(jsonb) TO authenticated;
