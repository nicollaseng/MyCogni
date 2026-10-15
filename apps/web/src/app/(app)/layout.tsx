import type { ReactNode } from 'react'
import { AppShell } from '@/features/shell/components/app-shell'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { displayName, email, timezone } = await requireOnboardedProfile()
  return (
    <AppShell name={displayName} email={email} timeZone={timezone}>
      {children}
    </AppShell>
  )
}
