CREATE TYPE "public"."data_export_status" AS ENUM('queued', 'running', 'ready', 'failed', 'expired');--> statement-breakpoint
ALTER TYPE "public"."notification_kind" ADD VALUE IF NOT EXISTS 'export_ready';--> statement-breakpoint
ALTER TYPE "public"."notification_kind" ADD VALUE IF NOT EXISTS 'export_failed';--> statement-breakpoint
CREATE TABLE "data_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "data_export_status" DEFAULT 'queued' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"storage_path" text,
	"size_bytes" bigint,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "data_exports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_exports_user_requested_idx" ON "data_exports" USING btree ("user_id","requested_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "data_exports_expiry_idx" ON "data_exports" USING btree ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "data_exports_one_active_idx" ON "data_exports" USING btree ("user_id") WHERE "data_exports"."status" in ('queued', 'running');--> statement-breakpoint
CREATE POLICY "data_exports_select_own" ON "data_exports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("data_exports"."user_id" = (select auth.uid()));
--> statement-breakpoint
REVOKE ALL ON public.data_exports FROM anon;
--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.data_exports FROM authenticated;
--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('exports', 'exports', false, ARRAY['application/zip'])
ON CONFLICT (id) DO NOTHING;
