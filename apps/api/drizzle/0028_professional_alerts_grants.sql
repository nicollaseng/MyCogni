REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.professional_alerts FROM anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (acknowledged_at, resolved_at) ON public.professional_alerts TO authenticated;
