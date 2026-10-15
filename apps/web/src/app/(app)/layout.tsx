import type { ReactNode } from 'react'
import { AppShell } from '@/features/shell/components/app-shell'
import { requireOnboardedUser } from '@/shared/lib/auth/session'

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireOnboardedUser()
  return <AppShell>{children}</AppShell>
}
