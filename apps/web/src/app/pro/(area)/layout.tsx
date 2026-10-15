import type { ReactNode } from 'react'
import { requireProfessional } from '@/features/professional/access'
import { ProfessionalShell } from '@/features/professional/components/professional-shell'
import { fetchAlertCount, preloadAlertCount } from '@/shared/lib/api/alerts'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'
import { guarded } from '@/shared/lib/settled'

export default async function ProfessionalAreaLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  preloadAlertCount()
  const [professional, photoUrl] = await guarded(requireProfessional(), fetchMyPhotoUrl())
  const alerts = professional.status === 'verified' ? await fetchAlertCount() : null
  return (
    <ProfessionalShell professional={professional} photoUrl={photoUrl} alerts={alerts}>
      {children}
    </ProfessionalShell>
  )
}
