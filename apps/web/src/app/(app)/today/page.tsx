import { dailyMoods } from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { MoodMap } from '@/features/mood/components/mood-map'
import { MoodStrip } from '@/features/mood/components/mood-strip'
import { isMoodLevel } from '@/features/mood/mood-levels'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { daysSince, isScreeningDue } from '@/features/screening/due'
import { latestByInstrument } from '@/features/screening/latest'
import { PageTitle } from '@/shared/components/page-title'
import { Panel, Section } from '@/shared/components/section'
import { fetchAssessments, fetchCheckIns } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { formatDayTitle } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('today.meta')
  return { title: t('title') }
}

const windowDays = 14
const dayInMs = 24 * 60 * 60 * 1000

export default async function TodayPage() {
  const { timezone } = await requireOnboardedProfile()
  const [t, locale] = await Promise.all([getTranslations('today'), getLocale()])
  const now = new Date()
  const [checkIns, assessments] = await Promise.all([
    fetchCheckIns({ since: new Date(now.getTime() - (windowDays + 1) * dayInMs), limit: 200 }),
    fetchAssessments(),
  ])
  const days = dailyMoods(
    checkIns.map((checkIn) => ({
      moodLevel: checkIn.moodLevel,
      recordedAt: new Date(checkIn.recordedAt),
    })),
    { timeZone: timezone, today: now, days: windowDays },
  ).map((level) => (level !== null && isMoodLevel(level) ? level : null))
  const recordedDays = days.filter((level) => level !== null).length
  const latest = latestByInstrument(assessments)
  const lastAnswer = assessments[0]?.completedAt

  return (
    <>
      <PageTitle kicker={formatDayTitle(now, timezone, locale)} title={t('title')} />

      <section className="flex items-center gap-6 sm:gap-10">
        <MoodMap valence={0.5} rings={9} className="size-32 shrink-0 sm:size-40" />
        <div className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">{t('intro')}</p>
          <Link href="/check-in" className={cn(buttonVariants({ shape: 'pill' }))}>
            {t('checkIn')}
          </Link>
        </div>
      </section>

      <Section title={t('recent.title', { days: windowDays })}>
        <Panel className="space-y-4 py-5">
          <MoodStrip
            days={days}
            label={
              recordedDays === 0
                ? t('recent.emptyLabel', { days: windowDays })
                : t('recent.label', { count: recordedDays, days: windowDays })
            }
          />
          <p className="text-sm text-muted-foreground">
            {recordedDays === 0
              ? t('recent.emptyHint')
              : t('recent.summary', { count: recordedDays, days: windowDays })}
          </p>
        </Panel>
      </Section>

      <LatestScreening results={latest} timeZone={timezone}>
        {lastAnswer !== undefined && isScreeningDue(lastAnswer, now) && (
          <Link
            href="/questionnaires"
            className="block px-1 underline decoration-1 underline-offset-4"
          >
            {t('screeningDue', { count: daysSince(lastAnswer, now) })}
          </Link>
        )}
      </LatestScreening>
    </>
  )
}
