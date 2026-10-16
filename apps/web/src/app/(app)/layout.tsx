import type { ReactNode } from 'react'
import { AmbientProvider } from '@/features/audio/ambient-provider'
import { linkedProfessionals } from '@/features/safety/prompt'
import { AppShell } from '@/features/shell/components/app-shell'
import { preloadNotifications } from '@/shared/lib/api/care'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'
import { guarded } from '@/shared/lib/settled'

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  preloadNotifications()
  const [{ displayName, email, timezone }, [photoUrl, professionals]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchMyPhotoUrl(), linkedProfessionals()]),
  )
  return (
    <AmbientProvider>
      <AppShell
        name={displayName}
        email={email}
        photoUrl={photoUrl}
        timeZone={timezone}
        professionals={professionals}
      >
        {children}
      </AppShell>
    </AmbientProvider>
  )
}
