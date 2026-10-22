ALTER TYPE "public"."notification_kind" ADD VALUE IF NOT EXISTS 'reminder';--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reminder_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"time" text DEFAULT '20:00' NOT NULL,
	"days" smallint[] DEFAULT '{0,1,2,3,4,5,6}'::smallint[] NOT NULL,
	"push" boolean DEFAULT false NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"last_sent_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminder_settings_time" CHECK ("reminder_settings"."time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
	CONSTRAINT "reminder_settings_days" CHECK (cardinality("reminder_settings"."days") between 1 and 7 and "reminder_settings"."days" <@ '{0,1,2,3,4,5,6}'::smallint[])
);
--> statement-breakpoint
ALTER TABLE "reminder_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_settings" ADD CONSTRAINT "reminder_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminder_settings_enabled_idx" ON "reminder_settings" USING btree ("enabled");--> statement-breakpoint
CREATE POLICY "push_subscriptions_select_own" ON "push_subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("push_subscriptions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_subscriptions_delete_own" ON "push_subscriptions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("push_subscriptions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reminder_settings_select_own" ON "reminder_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("reminder_settings"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reminder_settings_insert_own" ON "reminder_settings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("reminder_settings"."user_id" = (select auth.uid()) and public.current_account_type() = 'patient');--> statement-breakpoint
CREATE POLICY "reminder_settings_update_own" ON "reminder_settings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("reminder_settings"."user_id" = (select auth.uid())) WITH CHECK ("reminder_settings"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reminder_settings_delete_own" ON "reminder_settings" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("reminder_settings"."user_id" = (select auth.uid()));
--> statement-breakpoint
REVOKE ALL ON public.reminder_settings FROM anon;
--> statement-breakpoint
REVOKE ALL ON public.push_subscriptions FROM anon;
--> statement-breakpoint
REVOKE UPDATE, TRUNCATE ON public.reminder_settings FROM authenticated;
--> statement-breakpoint
GRANT UPDATE (enabled, time, days, push, email, updated_at) ON public.reminder_settings TO authenticated;
--> statement-breakpoint
REVOKE INSERT, UPDATE, TRUNCATE ON public.push_subscriptions FROM authenticated;
--> statement-breakpoint
CREATE FUNCTION public.claim_push_subscription(target_endpoint text, target_p256dh text, target_auth text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_account_type() IS DISTINCT FROM 'patient' THEN
    RAISE EXCEPTION 'Only patients receive practice reminders' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES (auth.uid(), target_endpoint, target_p256dh, target_auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        created_at = now(),
        last_used_at = NULL;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.claim_push_subscription(text, text, text) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.claim_push_subscription(text, text, text) TO authenticated;
