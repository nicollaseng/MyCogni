CREATE TYPE "public"."account_type" AS ENUM('patient', 'professional');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "account_type" "account_type" DEFAULT 'patient' NOT NULL;