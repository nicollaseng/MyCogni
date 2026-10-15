import type { ReactNode } from 'react'
import { requireProfessional } from '@/features/professional/access'
import { ProfessionalShell } from '@/features/professional/components/professional-shell'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'
import { guarded } from '@/shared/lib/settled'

export default async function ProfessionalAreaLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [professional, photoUrl] = await guarded(requireProfessional(), fetchMyPhotoUrl())
  return (
    <ProfessionalShell professional={professional} photoUrl={photoUrl}>
      {children}
    </ProfessionalShell>
  )
}
