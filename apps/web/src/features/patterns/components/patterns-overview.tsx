import { isUnlocked, pendingSections } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ReadingDigest } from '@/features/insights/components/reading-digest'
import { firstSentence } from '@/features/insights/readings'
import { useReadingPeriod } from '@/features/insights/use-reading-period'
import { DailyMoodChart } from '@/features/mood/components/daily-mood-chart'
import { Section } from '@/shared/components/section'
import { buttonVariants } from '@/shared/ui/button'
import type { PatternsModel } from '../model'
import { ContextEffects } from './context-effects'
import { FrequentTags } from './frequent-tags'
import { PeriodSummary } from './period-summary'
import { PeriodSwitch } from './period-switch'
import { ScoreHistory } from './score-history'
import { UpcomingList } from './upcoming-list'
import { WeekdayChart } from './weekday-chart'

interface PatternsOverviewProps {
  model: PatternsModel
  timeZone: string
}

export function PatternsOverview({ model, timeZone }: PatternsOverviewProps) {
  const t = useTranslations('patterns')
  const locale = useLocale()
  const periodOf = useReadingPeriod(timeZone, 'patient')
  const { period, statuses, readings } = model
  const [latest, ...earlier] = readings
  const upcoming = pendingSections(statuses)
  const unlocked = (section: Parameters<typeof isUnlocked>[1]) => isUnlocked(statuses, section)
  const recorded = model.recordedDays > 0

  return (
    <>
      {model.hasHistory ? (
        <PeriodSwitch period={period} />
      ) : (
        <div className="space-y-5">
          <p className="text-pretty text-muted-foreground">{t('empty')}</p>
          <Link href="/check-in" className={buttonVariants()}>
            {t('emptyAction')}
          </Link>
        </div>
      )}

      {model.hasHistory &&
        (recorded ? (
          <>
            <PeriodSummary
              summary={model.summary}
              period={period}
              recordedDays={model.recordedDays}
              streak={model.streak}
            />
            <Section title={t('chart.title')}>
              <DailyMoodChart days={model.days} label={t('chart.label', { days: period })} />
            </Section>
          </>
        ) : (
          <p className="text-muted-foreground">{t('period.none', { days: period })}</p>
        ))}

      {latest !== undefined && (
        <ReadingDigest
          latest={{ reading: latest, period: periodOf(latest) }}
          teaser={firstSentence(latest.content.summary, locale)}
          earlier={earlier.map((reading) => ({ reading, period: periodOf(reading) }))}
        />
      )}

      {unlocked('associations') &&
        (model.better.length === 0 && model.harder.length === 0 ? (
          <Section title={t('associations.title')}>
            <p className="text-pretty text-muted-foreground">{t('associations.similar')}</p>
          </Section>
        ) : (
          <ContextEffects better={model.better} harder={model.harder} />
        ))}

      {unlocked('weekdays') && <WeekdayChart weekdays={model.weekdays} />}

      {unlocked('frequent') && <FrequentTags emotions={model.emotions} contexts={model.contexts} />}

      {unlocked('scores') && <ScoreHistory assessments={model.assessments} timeZone={timeZone} />}

      {upcoming.length > 0 && <UpcomingList statuses={upcoming} />}

      {model.hasHistory && (
        <p className="text-sm text-pretty text-muted-foreground">{t('footnote')}</p>
      )}
    </>
  )
}
