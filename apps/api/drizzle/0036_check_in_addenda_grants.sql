REVOKE ALL ON public.check_in_addenda FROM anon;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON public.check_in_addenda FROM authenticated;
