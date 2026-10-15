import type { ReactNode } from 'react'
import { requireProfessional } from '@/features/professional/access'
import { ProfessionalShell } from '@/features/professional/components/professional-shell'

export default async function ProfessionalAreaLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const professional = await requireProfessional()
  return (
    <ProfessionalShell verified={professional.status === 'verified'}>{children}</ProfessionalShell>
  )
}
