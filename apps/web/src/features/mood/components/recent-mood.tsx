import { weekSummary, type MoodDay } from '@mycogni/domain'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { nearestMoodKey } from '../mood-levels'
import { DailyMoodChart } from './daily-mood-chart'

export function RecentMood({ days }: { days: readonly MoodDay[] }) {
  const t = useTranslations('today.recent')
  const mood = useTranslations('common.mood')
  const format = useFormatter()
  const locale = useLocale()
  const summary = weekSummary(days)
  const recorded = days.filter((day) => day.average !== null).length
  const decimal = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <Section title={t('title', { days: days.length })}>
      {recorded === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-6">
          <p className="max-w-xl leading-relaxed text-pretty">
            {summary.recent === null
              ? t('noRecentWeek')
              : t('average', {
                  average: decimal(summary.recent),
                  mood: mood(nearestMoodKey(summary.recent)).toLocaleLowerCase(locale),
                })}
            {summary.change !== null &&
              summary.previous !== null &&
              ` ${t(`change.${summary.change}`, { previous: decimal(summary.previous) })}`}
          </p>
          <DailyMoodChart days={days} label={t('chartLabel', { days: days.length })} />
          <p className="text-sm text-muted-foreground">
            {t('recorded', { count: recorded, days: days.length })}
          </p>
        </div>
      )}
    </Section>
  )
}
