ALTER TYPE "public"."alert_reason" ADD VALUE IF NOT EXISTS 'note_risk';--> statement-breakpoint
ALTER TABLE "professional_alerts" ADD COLUMN "check_in_id" uuid;--> statement-breakpoint
ALTER TABLE "professional_alerts" ADD COLUMN "journal_entry_id" uuid;--> statement-breakpoint
ALTER TABLE "professional_alerts" ADD CONSTRAINT "professional_alerts_check_in_id_check_ins_id_fk" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_alerts" ADD CONSTRAINT "professional_alerts_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE set null ON UPDATE no action;