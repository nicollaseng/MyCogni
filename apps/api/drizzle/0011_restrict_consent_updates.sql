REVOKE UPDATE ON public.consents FROM anon, authenticated;
--> statement-breakpoint
GRANT UPDATE (granted_at, revoked_at) ON public.consents TO authenticated;
