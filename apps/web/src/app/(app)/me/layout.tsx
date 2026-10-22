import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { SettingsFrame } from '@/features/account/components/settings-frame'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { initialsOf } from '@/shared/lib/initials'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'

export default async function MeLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [profile, photoUrl, t] = await Promise.all([
    requireOnboardedProfile(),
    fetchMyPhotoUrl(),
    getTranslations('account.profile'),
  ])

  return (
    <SettingsFrame
      name={profile.displayName ?? t('fallbackName')}
      email={profile.email}
      photoUrl={photoUrl}
      initials={initialsOf(profile.displayName, profile.email)}
    >
      {children}
    </SettingsFrame>
  )
}
