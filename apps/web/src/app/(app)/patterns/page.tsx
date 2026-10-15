import {
  consistencyOf,
  contextEffects,
  dayKey,
  frequentTags,
  insightLookbackDays,
  moodByWeekday,
  moodDays,
  notableEffects,
  patternRules,
} from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { PatientReadings } from '@/features/insights/components/patient-readings'
import { ConsistencySummary } from '@/features/patterns/components/consistency-summary'
import { ContextEffects } from '@/features/patterns/components/context-effects'
import { FrequentTags } from '@/features/patterns/components/frequent-tags'
import { ScoreHistory } from '@/features/patterns/components/score-history'
import { WeekdayChart } from '@/features/patterns/components/weekday-chart'
import { ReportExport } from '@/features/reports/components/report-export'
import { PageTitle } from '@/shared/components/page-title'
import { Section } from '@/shared/components/section'
import {
  countCheckIns,
  fetchAssessments,
  fetchCheckInsSince,
  fetchConsents,
  fetchInsights,
} from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { buttonVariants } from '@/shared/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('patterns.meta')
  return { title: t('title') }
}

const dayInMs = 24 * 60 * 60 * 1000

export default async function PatternsPage() {
  const { timezone } = await requireOnboardedProfile()
  const now = new Date()
  const [t, checkIns, assessments, readings, consents, recentCount] = await Promise.all([
    getTranslations('patterns'),
    fetchCheckInsSince(new Date(now.getTime() - patternRules.windowDays * dayInMs)),
    fetchAssessments(),
    fetchInsights(),
    fetchConsents(),
    countCheckIns({ since: new Date(now.getTime() - insightLookbackDays * dayInMs) }),
  ])
  const moods = checkIns.map((checkIn) => ({
    moodLevel: checkIn.moodLevel,
    recordedAt: new Date(checkIn.recordedAt),
    contexts: checkIn.contexts,
  }))
  const recordedDays = new Set(moods.map((mood) => dayKey(mood.recordedAt, timezone))).size
  const consistency = consistencyOf(
    moods.map((mood) => mood.recordedAt),
    { timeZone: timezone, today: now, days: patternRules.consistencyDays },
  )
  const comparable = contextEffects(moods, {
    timeZone: timezone,
    minDays: patternRules.minContextDays,
  })
  const effects = notableEffects(comparable, {
    minDifference: patternRules.minContextDifference,
    limit: patternRules.contextEffects,
  })

  return (
    <>
      <PageTitle
        title={t('title')}
        description={t('description')}
        action={
          checkIns.length > 0 ? (
            <ReportExport
              href="/patterns/report"
              audience="patient"
              summaries={readings.length > 0}
            />
          ) : undefined
        }
      />

      <PatientReadings
        readings={readings}
        progress={{
          enabled: consents.some((consent) => consent.kind === 'ai_processing'),
          recorded: recentCount,
        }}
        timeZone={timezone}
      />

      {checkIns.length === 0 ? (
        <div className="space-y-5">
          <p className="text-muted-foreground">{t('empty')}</p>
          <Link href="/check-in" className={buttonVariants()}>
            {t('emptyAction')}
          </Link>
        </div>
      ) : (
        <>
          <ConsistencySummary
            consistency={consistency}
            recordedDays={moodDays(moods, {
              timeZone: timezone,
              today: now,
              days: patternRules.consistencyDays,
            }).map((day) => day.count > 0)}
          />

          <Section title={t('weekdays.title')}>
            {recordedDays >= patternRules.minWeekdayDays ? (
              <WeekdayChart weekdays={moodByWeekday(moods, { timeZone: timezone })} />
            ) : (
              <p className="text-pretty text-muted-foreground">
                {t('weekdays.missing', {
                  minimum: patternRules.minWeekdayDays,
                  count: patternRules.minWeekdayDays - recordedDays,
                })}
              </p>
            )}
          </Section>

          <Section title={t('frequent.title')}>
            {checkIns.length >= patternRules.minTaggedCheckIns ? (
              <FrequentTags
                emotions={frequentTags(
                  checkIns.map((checkIn) => checkIn.emotions),
                  patternRules.frequentTags,
                )}
                contexts={frequentTags(
                  checkIns.map((checkIn) => checkIn.contexts),
                  patternRules.frequentTags,
                )}
              />
            ) : (
              <p className="text-pretty text-muted-foreground">
                {t('frequent.missing', { minimum: patternRules.minTaggedCheckIns })}
              </p>
            )}
          </Section>

          <Section title={t('contexts.title')}>
            {effects.length > 0 ? (
              <>
                <ContextEffects effects={effects} />
                <p className="text-sm text-pretty text-muted-foreground">{t('contexts.note')}</p>
              </>
            ) : (
              <p className="text-pretty text-muted-foreground">
                {comparable.length > 0
                  ? t('contexts.similar')
                  : t('contexts.missing', { days: patternRules.minContextDays })}
              </p>
            )}
          </Section>
        </>
      )}

      <Section title={t('scores.title')}>
        <ScoreHistory assessments={assessments} timeZone={timezone} />
      </Section>
    </>
  )
}
