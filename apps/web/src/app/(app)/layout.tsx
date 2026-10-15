import type { ReactNode } from 'react'
import { AppShell } from '@/features/shell/components/app-shell'
import { preloadNotifications } from '@/shared/lib/api/care'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'
import { guarded } from '@/shared/lib/settled'

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  preloadNotifications()
  const [{ displayName, email, timezone }, photoUrl] = await guarded(
    requireOnboardedProfile(),
    fetchMyPhotoUrl(),
  )
  return (
    <AppShell name={displayName} email={email} photoUrl={photoUrl} timeZone={timezone}>
      {children}
    </AppShell>
  )
}
