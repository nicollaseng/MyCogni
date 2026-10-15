CREATE TABLE "check_in_addenda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_in_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_in_addenda_text_length" CHECK (char_length("check_in_addenda"."text") between 1 and 1000)
);
--> statement-breakpoint
ALTER TABLE "check_in_addenda" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "check_in_addenda" ADD CONSTRAINT "check_in_addenda_check_in_id_check_ins_id_fk" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in_addenda" ADD CONSTRAINT "check_in_addenda_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "check_in_addenda_check_in_created_idx" ON "check_in_addenda" USING btree ("check_in_id","created_at");--> statement-breakpoint
CREATE POLICY "check_in_addenda_select_own" ON "check_in_addenda" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("check_in_addenda"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "check_in_addenda_select_shared_check_in" ON "check_in_addenda" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from public.check_ins ci
        where ci.id = "check_in_addenda"."check_in_id"
          and ci.user_id = "check_in_addenda"."user_id"
      ));--> statement-breakpoint
CREATE POLICY "check_in_addenda_insert_own" ON "check_in_addenda" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("check_in_addenda"."user_id" = (select auth.uid())
        and exists (
          select 1 from public.check_ins ci
          where ci.id = "check_in_addenda"."check_in_id"
            and ci.user_id = (select auth.uid())
        ));