CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mood_level" smallint NOT NULL,
	"emotions" text[] DEFAULT '{}'::text[] NOT NULL,
	"contexts" text[] DEFAULT '{}'::text[] NOT NULL,
	"note" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_ins_mood_level_range" CHECK ("check_ins"."mood_level" between 0 and 6)
);
--> statement-breakpoint
ALTER TABLE "check_ins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "check_ins_user_recorded_idx" ON "check_ins" USING btree ("user_id","recorded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE POLICY "check_ins_select_own" ON "check_ins" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("check_ins"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "check_ins_insert_own" ON "check_ins" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("check_ins"."user_id" = (select auth.uid()));