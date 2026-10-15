import type { ReactNode } from 'react'
import { AdminShell } from '@/features/admin/components/admin-shell'
import { requireUser } from '@/shared/lib/auth/session'

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireUser()
  return <AdminShell>{children}</AdminShell>
}
