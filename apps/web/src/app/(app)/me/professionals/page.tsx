import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsPage } from '@/features/account/components/settings-page'
import { endLink } from '@/features/care/actions'
import { CareLinks } from '@/features/care/components/care-links'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.nav')
  return { title: t('professionals') }
}

export default async function ProfessionalsPage() {
  const [profile, [careLinks, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchCareLinks(), getTranslations('account.nav')]),
  )

  return (
    <SettingsPage title={t('professionals')} ownTitles="hidden">
      <CareLinks links={careLinks} timeZone={profile.timezone} end={endLink} />
    </SettingsPage>
  )
}
