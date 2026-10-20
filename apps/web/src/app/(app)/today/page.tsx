import { moodDays, patternRules } from '@mycogni/domain'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { TermsNotice } from '@/features/care/components/terms-notice'
import { TodayActions } from '@/features/check-in/components/today-actions'
import { ReadingTeaser } from '@/features/insights/components/reading-teaser'
import { isRecentReading } from '@/features/insights/readings'
import { MoodMap } from '@/features/mood/components/mood-map'
import { RecentMood } from '@/features/mood/components/recent-mood'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { ScreeningSchedule } from '@/features/screening/components/screening-schedule'
import { latestPlainResults } from '@/features/screening/latest'
import { PageTitle } from '@/shared/components/page-title'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { fetchAssessments, fetchCheckIns, fetchInsights } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'
import { formatDayTitle } from '@/shared/lib/time'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('today.meta')
  return { title: t('title') }
}

const windowDays = patternRules.recentDays
const dayInMs = 24 * 60 * 60 * 1000

export default async function TodayPage() {
  const now = new Date()
  const [{ timezone }, [t, locale, checkIns, assessments, readings, careLinks]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([
      getTranslations('today'),
      getLocale(),
      fetchCheckIns({ since: new Date(now.getTime() - (windowDays + 1) * dayInMs), limit: 200 }),
      fetchAssessments(),
      fetchInsights(),
      fetchCareLinks(),
    ]),
  )
  const days = moodDays(
    checkIns.map((checkIn) => ({
      moodLevel: checkIn.moodLevel,
      recordedAt: new Date(checkIn.recordedAt),
    })),
    { timeZone: timezone, today: now, days: windowDays },
  )
  const lastAnswer = assessments[0]?.completedAt
  const latestReading = readings[0]

  return (
    <>
      <PageTitle kicker={formatDayTitle(now, timezone, locale)} title={t('title')} />

      <TermsNotice links={careLinks} />

      <section className="flex items-center gap-6 sm:gap-10">
        <MoodMap valence={0.5} rings={9} className="size-32 shrink-0 sm:size-40" />
        <div className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">{t('intro')}</p>
          <TodayActions />
        </div>
      </section>

      <RecentMood days={days} />

      {latestReading !== undefined && isRecentReading(latestReading.createdAt, now) && (
        <ReadingTeaser reading={latestReading} timeZone={timezone} />
      )}

      <LatestScreening results={latestPlainResults(assessments)} timeZone={timezone}>
        {lastAnswer !== undefined && (
          <ScreeningSchedule
            lastAnswer={lastAnswer}
            now={now}
            timeZone={timezone}
            offerRetake="whenDue"
          />
        )}
      </LatestScreening>
    </>
  )
}
