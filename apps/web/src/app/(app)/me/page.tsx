import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LegacyAnchor } from '@/features/account/components/legacy-anchor'
import { ProfileSettings } from '@/features/account/components/profile-settings'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account')
  return { title: t('title') }
}

export default function MePage() {
  return (
    <>
      <LegacyAnchor />
      <ProfileSettings />
    </>
  )
}
