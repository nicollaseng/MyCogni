import type { ReactNode } from 'react'
import { AppShell } from '@/features/shell/components/app-shell'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireOnboardedProfile()
  return <AppShell>{children}</AppShell>
}
