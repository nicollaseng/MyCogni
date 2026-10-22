import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsPage } from '@/features/account/components/settings-page'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { ScreeningHistory } from '@/features/screening/components/screening-history'
import { ScreeningSchedule } from '@/features/screening/components/screening-schedule'
import { latestPlainResults } from '@/features/screening/latest'
import { fetchAssessments } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.nav')
  return { title: t('wellbeing') }
}

export default async function WellbeingPage() {
  const [profile, [assessments, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchAssessments(), getTranslations('account.nav')]),
  )
  const lastAnswer = assessments[0]?.completedAt

  return (
    <SettingsPage title={t('wellbeing')} ownTitles="hidden">
      <LatestScreening results={latestPlainResults(assessments)} timeZone={profile.timezone}>
        <ScreeningHistory assessments={assessments} timeZone={profile.timezone} />
        {lastAnswer !== undefined && (
          <ScreeningSchedule
            lastAnswer={lastAnswer}
            now={new Date()}
            timeZone={profile.timezone}
            offerRetake="always"
          />
        )}
      </LatestScreening>
    </SettingsPage>
  )
}
