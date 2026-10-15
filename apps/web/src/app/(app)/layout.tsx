import type { ReactNode } from 'react'
import { AppShell } from '@/features/shell/components/app-shell'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { ownPhotoUrl } from '@/shared/lib/photos'

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { displayName, email, avatarPath, timezone } = await requireOnboardedProfile()
  return (
    <AppShell
      name={displayName}
      email={email}
      photoUrl={await ownPhotoUrl(avatarPath)}
      timeZone={timezone}
    >
      {children}
    </AppShell>
  )
}
