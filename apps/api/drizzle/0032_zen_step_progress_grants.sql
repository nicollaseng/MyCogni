REVOKE ALL ON public.zen_step_progress FROM anon;
--> statement-breakpoint
REVOKE UPDATE, TRUNCATE ON public.zen_step_progress FROM authenticated;
