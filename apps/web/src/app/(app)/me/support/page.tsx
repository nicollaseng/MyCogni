import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsPage } from '@/features/account/components/settings-page'
import { SupportSection } from '@/features/support/components/support-section'
import { fetchSupportTickets } from '@/shared/lib/api/support'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.nav')
  return { title: t('support') }
}

export default async function SupportPage() {
  const [profile, [tickets, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchSupportTickets(), getTranslations('account.nav')]),
  )

  return (
    <SettingsPage title={t('support')} ownTitles="hidden">
      <SupportSection tickets={tickets} timeZone={profile.timezone} />
    </SettingsPage>
  )
}
