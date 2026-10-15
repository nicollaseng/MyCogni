import type { ReactNode } from 'react'
import { requireProfessional } from '@/features/professional/access'
import { ProfessionalShell } from '@/features/professional/components/professional-shell'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'

export default async function ProfessionalAreaLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const professional = await requireProfessional()
  return (
    <ProfessionalShell professional={professional} photoUrl={await fetchMyPhotoUrl()}>
      {children}
    </ProfessionalShell>
  )
}
