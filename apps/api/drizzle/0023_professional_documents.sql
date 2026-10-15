CREATE TABLE "professional_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_documents_path_unique" UNIQUE("path"),
	CONSTRAINT "professional_documents_content_type" CHECK ("professional_documents"."content_type" in ('application/pdf', 'image/jpeg', 'image/png')),
	CONSTRAINT "professional_documents_size" CHECK ("professional_documents"."size_bytes" between 1 and 10485760),
	CONSTRAINT "professional_documents_file_name_length" CHECK (char_length("professional_documents"."file_name") between 1 and 200)
);
--> statement-breakpoint
ALTER TABLE "professional_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "professional_documents" ADD CONSTRAINT "professional_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "professional_documents_user_created_idx" ON "professional_documents" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_review_note_length" CHECK (char_length("professional_profiles"."review_note") <= 500);--> statement-breakpoint
CREATE POLICY "professional_documents_select_own" ON "professional_documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("professional_documents"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "professional_documents_select_admin" ON "professional_documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());--> statement-breakpoint
CREATE POLICY "professional_documents_insert_own" ON "professional_documents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("professional_documents"."user_id" = (select auth.uid())
        and split_part("professional_documents"."path", '/', 1) = (select auth.uid())::text
        and exists (
          select 1 from public.professional_profiles p
          where p.user_id = (select auth.uid()) and p.status <> 'verified'
        )
        and exists (
          select 1 from storage.objects o
          where o.bucket_id = 'professional-documents' and o.name = "professional_documents"."path"
        ));