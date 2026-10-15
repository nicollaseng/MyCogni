import { moodDays, patternRules } from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { ReadingTeaser } from '@/features/insights/components/reading-teaser'
import { isRecentReading } from '@/features/insights/readings'
import { MoodMap } from '@/features/mood/components/mood-map'
import { RecentMood } from '@/features/mood/components/recent-mood'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { ScreeningSchedule } from '@/features/screening/components/screening-schedule'
import { latestByInstrument } from '@/features/screening/latest'
import { PageTitle } from '@/shared/components/page-title'
import { fetchAssessments, fetchCheckIns, fetchInsights } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { formatDayTitle } from '@/shared/lib/time'
import { buttonVariants } from '@/shared/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('today.meta')
  return { title: t('title') }
}

const windowDays = patternRules.recentDays
const dayInMs = 24 * 60 * 60 * 1000

export default async function TodayPage() {
  const { timezone } = await requireOnboardedProfile()
  const [t, locale] = await Promise.all([getTranslations('today'), getLocale()])
  const now = new Date()
  const [checkIns, assessments, readings] = await Promise.all([
    fetchCheckIns({ since: new Date(now.getTime() - (windowDays + 1) * dayInMs), limit: 200 }),
    fetchAssessments(),
    fetchInsights(),
  ])
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

      <section className="flex items-center gap-6 sm:gap-10">
        <MoodMap valence={0.5} rings={9} className="size-32 shrink-0 sm:size-40" />
        <div className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">{t('intro')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/check-in" className={buttonVariants()}>
              {t('checkIn')}
            </Link>
            <Link href="/mybook" className={buttonVariants({ variant: 'outline' })}>
              {t('writeMyBook')}
            </Link>
          </div>
        </div>
      </section>

      <RecentMood days={days} />

      {latestReading !== undefined && isRecentReading(latestReading.createdAt, now) && (
        <ReadingTeaser reading={latestReading} timeZone={timezone} />
      )}

      <LatestScreening results={latestByInstrument(assessments)} timeZone={timezone}>
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
