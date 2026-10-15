CREATE TYPE "public"."assessment_instrument" AS ENUM('phq9', 'gad7');--> statement-breakpoint
CREATE TYPE "public"."assessment_severity" AS ENUM('minimal', 'mild', 'moderate', 'moderately_severe', 'severe');--> statement-breakpoint
CREATE TYPE "public"."consent_kind" AS ENUM('terms', 'privacy', 'health_data', 'ai_processing', 'adult');--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instrument" "assessment_instrument" NOT NULL,
	"answers" smallint[] NOT NULL,
	"total_score" smallint NOT NULL,
	"severity" "assessment_severity" NOT NULL,
	"has_risk_flag" boolean NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "consent_kind" NOT NULL,
	"version" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessments_user_completed_idx" ON "assessments" USING btree ("user_id","completed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "consents_user_kind_version_key" ON "consents" USING btree ("user_id","kind","version");--> statement-breakpoint
CREATE POLICY "assessments_select_own" ON "assessments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("assessments"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "assessments_insert_own" ON "assessments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("assessments"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "consents_select_own" ON "consents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("consents"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "consents_insert_own" ON "consents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("consents"."user_id" = (select auth.uid()));