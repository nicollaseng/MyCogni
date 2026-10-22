import type { PatientSummary, ScreeningSummary } from '@mycogni/contracts'
import {
  instruments,
  maxMoodLevel,
  maxScoreOf,
  twoStepScreens,
  type ScreeningDomain,
} from '@mycogni/domain'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { formatShortDate } from '../dates'
import { latestScreenings } from '../screenings'
import { moodTrend } from '../trend'
import { TrendIcon } from './icons'
import { Stat, StatStrip } from './stat-tile'

interface PatientKpisProps {
  patient: PatientSummary
  timeZone: string
}

function ScreeningTile({
  domain,
  screening,
  timeZone,
}: {
  domain: ScreeningDomain
  screening: ScreeningSummary | undefined
  timeZone: string
}) {
  const t = useTranslations('professional')
  const severity = useTranslations('screening.severity')
  const locale = useLocale()
  const instrument =
    screening === undefined ? twoStepScreens[domain].full : instruments[screening.instrument]
  const label = t('patient.kpis.latest', { name: instrument.name })
  if (screening === undefined) {
    return <Stat label={label} value="—" caption={t('screening.notAnswered')} />
  }
  const max = maxScoreOf(instrument)
  return (
    <Stat
      label={label}
      value={
        <>
          <span aria-hidden>
            {screening.totalScore}
            <span className="text-base font-normal text-muted-foreground">/{max}</span>
          </span>
          <span className="sr-only">
            {t('screening.score', { score: screening.totalScore, max })}
          </span>
        </>
      }
      caption={t('patient.kpis.screening', {
        severity: severity(screening.severity),
        date: formatShortDate(new Date(screening.completedAt), timeZone, locale),
      })}
    />
  )
}

const trendStyles = {
  up: 'text-emphasis',
  down: 'text-help',
  steady: 'text-muted-foreground',
} as const

function TrendCaption({ average, previous }: { average: number | null; previous: number | null }) {
  const t = useTranslations('professional')
  const format = useFormatter()
  if (average === null) {
    return <>{t('mood.empty')}</>
  }
  const trend = moodTrend(average, previous)
  if (trend === null) {
    return <>{t('patient.kpis.noPrevious')}</>
  }
  return (
    <span className="inline-flex items-start gap-1">
      <TrendIcon
        direction={trend.direction}
        className={`mt-[3px] ${trendStyles[trend.direction]}`}
      />
      {t(`mood.trend.${trend.direction}`, {
        delta: format.number(Math.abs(trend.delta), {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      })}
    </span>
  )
}

export function PatientKpis({ patient, timeZone }: PatientKpisProps) {
  const t = useTranslations('professional')
  const format = useFormatter()
  const latest = latestScreenings(patient.screenings)
  const decimal = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <StatStrip label={t('overview.kpis.label')}>
      <Stat
        label={t('patient.kpis.mood')}
        value={
          patient.moodAverage === null ? (
            '—'
          ) : (
            <span className="flex items-baseline gap-1">
              {decimal(patient.moodAverage)}
              <span className="text-base font-normal text-muted-foreground">/{maxMoodLevel}</span>
            </span>
          )
        }
        caption={
          <TrendCaption average={patient.moodAverage} previous={patient.previousMoodAverage} />
        }
      />
      <Stat
        label={t('patient.kpis.checkIns')}
        value={format.number(patient.checkInsLast30Days)}
        caption={t('patient.kpis.week', { count: patient.checkInsLastWeek })}
      />
      <ScreeningTile domain="depression" screening={latest.depression} timeZone={timeZone} />
      <ScreeningTile domain="anxiety" screening={latest.anxiety} timeZone={timeZone} />
    </StatStrip>
  )
}
