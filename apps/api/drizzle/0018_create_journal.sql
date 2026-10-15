CREATE TYPE "public"."journal_share_scope" AS ENUM('all', 'entries');--> statement-breakpoint
CREATE TABLE "journal_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"share_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_access_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"body" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL,
	"plain_text" text DEFAULT '' NOT NULL,
	"image_paths" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_title_length" CHECK (char_length("journal_entries"."title") <= 200),
	CONSTRAINT "journal_entries_text_length" CHECK (char_length("journal_entries"."plain_text") <= 100000),
	CONSTRAINT "journal_entries_body_size" CHECK (octet_length("journal_entries"."body"::text) <= 600000),
	CONSTRAINT "journal_entries_image_count" CHECK (cardinality("journal_entries"."image_paths") <= 30)
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journal_share_entries" (
	"share_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	CONSTRAINT "journal_share_entries_share_id_entry_id_pk" PRIMARY KEY("share_id","entry_id")
);
--> statement-breakpoint
ALTER TABLE "journal_share_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "journal_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"care_link_id" uuid NOT NULL,
	"scope" "journal_share_scope" NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_shares" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "journal_access_log" ADD CONSTRAINT "journal_access_log_share_id_journal_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."journal_shares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_access_log" ADD CONSTRAINT "journal_access_log_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_access_log" ADD CONSTRAINT "journal_access_log_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_share_entries" ADD CONSTRAINT "journal_share_entries_share_id_journal_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."journal_shares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_share_entries" ADD CONSTRAINT "journal_share_entries_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_shares" ADD CONSTRAINT "journal_shares_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_shares" ADD CONSTRAINT "journal_shares_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_shares" ADD CONSTRAINT "journal_shares_care_link_id_care_links_id_fk" FOREIGN KEY ("care_link_id") REFERENCES "public"."care_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_access_log_share_idx" ON "journal_access_log" USING btree ("share_id","accessed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "journal_entries_user_updated_idx" ON "journal_entries" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "journal_share_entries_entry_idx" ON "journal_share_entries" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "journal_shares_patient_idx" ON "journal_shares" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "journal_shares_professional_idx" ON "journal_shares" USING btree ("professional_id");--> statement-breakpoint
CREATE POLICY "journal_access_log_select_participants" ON "journal_access_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("journal_access_log"."professional_id" = (select auth.uid()) or exists (
        select 1 from public.journal_shares s
        where s.id = "journal_access_log"."share_id" and s.patient_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "journal_access_log_insert_by_professional" ON "journal_access_log" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("journal_access_log"."professional_id" = (select auth.uid())
        and exists (
          select 1 from public.journal_shares s
          where s.id = "journal_access_log"."share_id"
            and s.professional_id = (select auth.uid())
            and s.revoked_at is null
            and (s.expires_at is null or s.expires_at > now())
        ));--> statement-breakpoint
CREATE POLICY "journal_entries_select_own" ON "journal_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("journal_entries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "journal_entries_select_shared" ON "journal_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.can_read_shared_journal_entry("journal_entries"."id", "journal_entries"."user_id"));--> statement-breakpoint
CREATE POLICY "journal_entries_insert_own" ON "journal_entries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("journal_entries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "journal_entries_update_own" ON "journal_entries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("journal_entries"."user_id" = (select auth.uid())) WITH CHECK ("journal_entries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "journal_entries_delete_own" ON "journal_entries" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("journal_entries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "journal_share_entries_select_participants" ON "journal_share_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from public.journal_shares s
        where s.id = "journal_share_entries"."share_id"
          and (s.patient_id = (select auth.uid()) or s.professional_id = (select auth.uid()))
      ));--> statement-breakpoint
CREATE POLICY "journal_share_entries_insert_by_patient" ON "journal_share_entries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
          select 1 from public.journal_shares s
          where s.id = "journal_share_entries"."share_id" and s.patient_id = (select auth.uid()) and s.scope = 'entries'
        )
        and exists (
          select 1 from public.journal_entries e
          where e.id = "journal_share_entries"."entry_id" and e.user_id = (select auth.uid())
        ));--> statement-breakpoint
CREATE POLICY "journal_shares_select_participants" ON "journal_shares" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("journal_shares"."patient_id" = (select auth.uid()) or "journal_shares"."professional_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "journal_shares_insert_by_patient" ON "journal_shares" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("journal_shares"."patient_id" = (select auth.uid())
        and "journal_shares"."revoked_at" is null
        and exists (
          select 1 from public.care_links cl
          where cl.id = "journal_shares"."care_link_id"
            and cl.patient_id = (select auth.uid())
            and cl.professional_id = "journal_shares"."professional_id"
            and cl.ended_at is null
        ));--> statement-breakpoint
CREATE POLICY "journal_shares_revoke_by_patient" ON "journal_shares" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("journal_shares"."patient_id" = (select auth.uid())) WITH CHECK ("journal_shares"."patient_id" = (select auth.uid()));