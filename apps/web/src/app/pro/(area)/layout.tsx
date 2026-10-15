import type { ReactNode } from 'react'
import { requireProfessional } from '@/features/professional/access'
import { ProfessionalShell } from '@/features/professional/components/professional-shell'
import { fetchAlertCount } from '@/shared/lib/api/alerts'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'

export default async function ProfessionalAreaLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const professional = await requireProfessional()
  const [photoUrl, alerts] = await Promise.all([
    fetchMyPhotoUrl(),
    professional.status === 'verified' ? fetchAlertCount() : Promise.resolve(null),
  ])
  return (
    <ProfessionalShell professional={professional} photoUrl={photoUrl} alerts={alerts}>
      {children}
    </ProfessionalShell>
  )
}
