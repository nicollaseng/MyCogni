import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ProfileSettings } from '@/features/account/components/profile-settings'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.nav')
  return { title: t('profile') }
}

export default function ProfilePage() {
  return <ProfileSettings />
}
