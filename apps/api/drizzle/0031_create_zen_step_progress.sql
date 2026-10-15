CREATE TABLE "zen_step_progress" (
	"user_id" uuid NOT NULL,
	"track_id" text NOT NULL,
	"step_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zen_step_progress_user_id_track_id_step_id_pk" PRIMARY KEY("user_id","track_id","step_id"),
	CONSTRAINT "zen_step_progress_track_length" CHECK (char_length("zen_step_progress"."track_id") <= 60),
	CONSTRAINT "zen_step_progress_step_length" CHECK (char_length("zen_step_progress"."step_id") <= 60)
);
--> statement-breakpoint
ALTER TABLE "zen_step_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "zen_step_progress" ADD CONSTRAINT "zen_step_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "zen_step_progress_select_own" ON "zen_step_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("zen_step_progress"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "zen_step_progress_insert_own" ON "zen_step_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("zen_step_progress"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "zen_step_progress_delete_own" ON "zen_step_progress" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("zen_step_progress"."user_id" = (select auth.uid()));