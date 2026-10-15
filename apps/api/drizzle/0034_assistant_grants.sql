REVOKE ALL ON public.assistant_conversations FROM anon;
--> statement-breakpoint
REVOKE ALL ON public.assistant_messages FROM anon;
--> statement-breakpoint
REVOKE UPDATE, TRUNCATE ON public.assistant_conversations FROM authenticated;
--> statement-breakpoint
GRANT UPDATE (risk, updated_at) ON public.assistant_conversations TO authenticated;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON public.assistant_messages FROM authenticated;
