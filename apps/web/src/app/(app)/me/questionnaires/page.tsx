import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsPage } from '@/features/account/components/settings-page'
import { QuestionnaireList } from '@/features/questionnaires/components/questionnaire-list'
import { fetchMyQuestionnaires } from '@/shared/lib/api/questionnaires'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.nav')
  return { title: t('questionnaires') }
}

export default async function MyQuestionnairesPage() {
  const [profile, [questionnaires, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchMyQuestionnaires(), getTranslations('account.nav')]),
  )

  return (
    <SettingsPage title={t('questionnaires')}>
      <QuestionnaireList questionnaires={questionnaires} timeZone={profile.timezone} />
    </SettingsPage>
  )
}
