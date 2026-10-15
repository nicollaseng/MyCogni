CREATE TYPE "public"."support_requester_role" AS ENUM('patient', 'professional');--> statement-breakpoint
CREATE TYPE "public"."support_subject" AS ENUM('account', 'technical', 'privacy', 'professional', 'billing', 'suggestion', 'other');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('pending', 'in_progress', 'closed');--> statement-breakpoint
ALTER TYPE "public"."notification_kind" ADD VALUE IF NOT EXISTS 'support';--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "support_tickets_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1001 CACHE 1),
	"user_id" uuid NOT NULL,
	"requester_role" "support_requester_role" NOT NULL,
	"subject" "support_subject" NOT NULL,
	"custom_subject" text,
	"message" text NOT NULL,
	"attachment_path" text,
	"attachment_name" text,
	"attachment_type" text,
	"attachment_size" integer,
	"status" "support_ticket_status" DEFAULT 'pending' NOT NULL,
	"locale" text NOT NULL,
	"closing_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"taken_at" timestamp with time zone,
	"taken_by" uuid,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	CONSTRAINT "support_tickets_number_unique" UNIQUE("number"),
	CONSTRAINT "support_tickets_attachment_path_unique" UNIQUE("attachment_path"),
	CONSTRAINT "support_tickets_custom_subject" CHECK (("support_tickets"."subject" = 'other') = ("support_tickets"."custom_subject" is not null)
        and char_length("support_tickets"."custom_subject") between 3 and 120),
	CONSTRAINT "support_tickets_message_length" CHECK (char_length("support_tickets"."message") between 10 and 4000),
	CONSTRAINT "support_tickets_attachment_complete" CHECK (num_nulls("support_tickets"."attachment_path", "support_tickets"."attachment_name", "support_tickets"."attachment_type", "support_tickets"."attachment_size") in (0, 4)),
	CONSTRAINT "support_tickets_attachment_type" CHECK ("support_tickets"."attachment_type" in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain')),
	CONSTRAINT "support_tickets_attachment_size" CHECK ("support_tickets"."attachment_size" between 1 and case when "support_tickets"."attachment_type" like 'image/%' then 5242880 else 2097152 end),
	CONSTRAINT "support_tickets_attachment_name_length" CHECK (char_length("support_tickets"."attachment_name") between 1 and 200),
	CONSTRAINT "support_tickets_locale" CHECK ("support_tickets"."locale" in ('pt-BR', 'pt-PT', 'en-US', 'en-GB')),
	CONSTRAINT "support_tickets_closing_note_length" CHECK (char_length("support_tickets"."closing_note") <= 1000),
	CONSTRAINT "support_tickets_closed_at" CHECK (("support_tickets"."status" = 'closed') = ("support_tickets"."closed_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "support_ticket_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "support_status" "support_ticket_status";--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_taken_by_users_id_fk" FOREIGN KEY ("taken_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_tickets_user_created_idx" ON "support_tickets" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "support_tickets_status_created_idx" ON "support_tickets" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_support_ticket_id_support_tickets_id_fk" FOREIGN KEY ("support_ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "support_tickets_select_own" ON "support_tickets" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("support_tickets"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "support_tickets_select_admin" ON "support_tickets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());--> statement-breakpoint
CREATE POLICY "support_tickets_insert_own" ON "support_tickets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("support_tickets"."user_id" = (select auth.uid())
        and "support_tickets"."status" = 'pending'
        and "support_tickets"."created_at" = now()
        and num_nulls("support_tickets"."taken_at", "support_tickets"."taken_by", "support_tickets"."closed_at", "support_tickets"."closed_by", "support_tickets"."closing_note") = 5
        and (
          "support_tickets"."requester_role" = 'patient'
          or exists (select 1 from public.professional_profiles p where p.user_id = (select auth.uid()))
        )
        and (
          "support_tickets"."attachment_path" is null
          or (
            split_part("support_tickets"."attachment_path", '/', 1) = (select auth.uid())::text
            and exists (
              select 1 from storage.objects o
              where o.bucket_id = 'support-attachments'
                and o.name = "support_tickets"."attachment_path"
                and o.metadata ->> 'mimetype' = "support_tickets"."attachment_type"
                and (o.metadata ->> 'size')::bigint = "support_tickets"."attachment_size"
            )
          )
        ));