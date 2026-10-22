export function isAdminRole(appMetadata: Readonly<Record<string, unknown>> | undefined): boolean {
  return appMetadata?.role === 'admin'
}
