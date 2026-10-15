import type { CheckIn } from '@mycogni/contracts'
import { dailyMoods, maxMoodLevel } from '@mycogni/domain'
import { useFormatter, useTranslations } from 'next-intl'
import { MoodStrip } from '@/features/mood/components/mood-strip'
import { isMoodLevel, moodKeyOf } from '@/features/mood/mood-levels'
import { Panel, Section } from '@/shared/components/section'
import { moodTrend, type MoodTrend } from '../trend'

interface MoodOverviewProps {
  checkIns: readonly CheckIn[]
  timeZone: string
  now: Date
  days: number
}

function TrendText({ trend }: { trend: MoodTrend }) {
  const t = useTranslations('professional.patient.trend')
  const mood = useTranslations('common.mood')
  const format = useFormatter()
  const number = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const rounded = Math.round(trend.recent)
  if (!isMoodLevel(rounded)) {
    return null
  }
  const recent = t('recent', {
    mood: mood(moodKeyOf(rounded)),
    average: number(trend.recent),
    max: maxMoodLevel,
  })
  const comparison =
    trend.direction === null || trend.previous === null
      ? null
      : t(trend.direction, { previous: number(trend.previous) })

  return (
    <p className="leading-relaxed">{comparison === null ? recent : `${recent} ${comparison}`}</p>
  )
}

export function MoodOverview({ checkIns, timeZone, now, days }: MoodOverviewProps) {
  const t = useTranslations('professional.patient.mood')
  const levels = dailyMoods(
    checkIns.map((checkIn) => ({
      moodLevel: checkIn.moodLevel,
      recordedAt: new Date(checkIn.recordedAt),
    })),
    { timeZone, today: now, days },
  ).map((level) => (level !== null && isMoodLevel(level) ? level : null))
  const recorded = levels.filter((level) => level !== null).length
  const trend = moodTrend(checkIns, { timeZone, now })

  return (
    <Section title={t('title', { days })}>
      <Panel className="space-y-4 py-5">
        <MoodStrip
          days={levels}
          label={recorded === 0 ? t('emptyLabel', { days }) : t('label', { count: recorded, days })}
        />
        {recorded === 0 && <p className="text-sm text-muted-foreground">{t('empty', { days })}</p>}
        {trend !== null && <TrendText trend={trend} />}
      </Panel>
    </Section>
  )
}
