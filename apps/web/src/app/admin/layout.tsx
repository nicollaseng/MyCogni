import type { ReactNode } from 'react'
import { AdminShell } from '@/features/admin/components/admin-shell'
import { requireAdmin } from '@/shared/lib/auth/admin'

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdmin()
  return <AdminShell>{children}</AdminShell>
}
