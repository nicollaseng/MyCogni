import type { PatientSummary, ScreeningSummary } from '@mycogni/contracts'
import {
  instruments,
  isShortScreen,
  maxMoodLevel,
  maxScoreOf,
  type AttentionReason,
} from '@mycogni/domain'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { isMoodLevel, moodColor, moodKeyOf, valenceOf } from '@/features/mood/mood-levels'
import { cn } from '@/shared/lib/utils'
import { formatDateTime, formatShortDate, recencyOf } from '../dates'
import { moodTrend } from '../trend'
import { AlertIcon, TrendIcon } from './icons'

interface TimeProps {
  now: Date
  timeZone: string
}

export function RelativeTime({ date, now, timeZone }: { date: string } & TimeProps) {
  const t = useTranslations('professional.time')
  const locale = useLocale()
  const moment = new Date(date)
  const recency = recencyOf(moment, now, timeZone)
  const text =
    recency.unit === 'date'
      ? formatShortDate(moment, timeZone, locale)
      : recency.unit === 'now'
        ? t('now')
        : t(recency.unit, { count: recency.count })
  return (
    <time dateTime={date} title={formatDateTime(moment, timeZone, locale)}>
      {text}
    </time>
  )
}

export function MoodDot({ value, className }: { value: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: moodColor(value / maxMoodLevel) }}
    />
  )
}

export function MoodLabel({ level }: { level: number }) {
  const mood = useTranslations('common.mood')
  if (!isMoodLevel(level)) {
    return null
  }
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: moodColor(valenceOf(level)) }}
      />
      {mood(moodKeyOf(level))}
    </span>
  )
}

export function AttentionReasons({ reasons }: { reasons: readonly AttentionReason[] }) {
  const t = useTranslations('professional.attention')
  if (reasons.length === 0) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">{t('none')}</span>
      </span>
    )
  }
  return (
    <ul aria-label={t('label')} className="flex flex-wrap gap-x-3.5 gap-y-1">
      {reasons.map((reason) => (
        <li
          key={reason}
          className={cn(
            'inline-flex items-center gap-1.5 text-[13px] leading-5 whitespace-nowrap md:text-sm',
            reason === 'risk_item' && 'font-medium text-(--warn)',
          )}
        >
          {reason === 'risk_item' ? (
            <AlertIcon className="size-3.5" />
          ) : (
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
          )}
          {t(`reasons.${reason}`)}
        </li>
      ))}
    </ul>
  )
}

export function LastCheckIn({
  lastCheckIn,
  now,
  timeZone,
}: { lastCheckIn: PatientSummary['lastCheckIn'] } & TimeProps) {
  const t = useTranslations('professional.patients')
  if (lastCheckIn === null) {
    return <span className="text-muted-foreground">{t('noCheckIn')}</span>
  }
  return (
    <span className="flex flex-col gap-0.5">
      <MoodLabel level={lastCheckIn.moodLevel} />
      <span className="pl-[18px] text-sm text-muted-foreground">
        <RelativeTime date={lastCheckIn.recordedAt} now={now} timeZone={timeZone} />
      </span>
    </span>
  )
}

const trendStyles = {
  up: 'text-emphasis',
  down: 'text-help',
  steady: 'text-muted-foreground',
} as const

export function MoodAverage({
  average,
  previous,
}: {
  average: number | null
  previous: number | null
}) {
  const t = useTranslations('professional.mood')
  const format = useFormatter()
  if (average === null) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">{t('empty')}</span>
      </span>
    )
  }
  const number = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const trend = moodTrend(average, previous)
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="inline-flex items-baseline gap-1.5">
        <MoodDot value={average} className="size-2 self-center" />
        <span className="font-medium">{number(average)}</span>
        <span aria-hidden className="text-sm text-muted-foreground">
          /{maxMoodLevel}
        </span>
        <span className="sr-only">{t('value', { value: number(average), max: maxMoodLevel })}</span>
      </span>
      {trend !== null && (
        <span
          className={cn('inline-flex items-center gap-0.5 text-sm', trendStyles[trend.direction])}
        >
          <TrendIcon direction={trend.direction} />
          {trend.direction !== 'steady' && <span aria-hidden>{number(Math.abs(trend.delta))}</span>}
          <span className="sr-only">
            {t(`trend.${trend.direction}`, { delta: number(Math.abs(trend.delta)) })}
          </span>
        </span>
      )}
    </span>
  )
}

export function ScreeningScore({ screening }: { screening: ScreeningSummary | undefined }) {
  const t = useTranslations('professional.screening')
  const severity = useTranslations('screening.severity')
  if (screening === undefined) {
    return <span className="text-muted-foreground">{t('notAnswered')}</span>
  }
  const max = maxScoreOf(instruments[screening.instrument])
  return (
    <span className="flex flex-col gap-0.5">
      <span className="tabular-nums">
        <span aria-hidden>
          <span className="font-medium">{screening.totalScore}</span>
          <span className="text-sm text-muted-foreground">/{max}</span>
        </span>
        <span className="sr-only">{t('score', { score: screening.totalScore, max })}</span>
      </span>
      <span className="text-sm text-muted-foreground">
        {isShortScreen(instruments[screening.instrument])
          ? `${instruments[screening.instrument].name} · ${severity(screening.severity)}`
          : severity(screening.severity)}
      </span>
    </span>
  )
}

export function SinceDate({ startedAt, timeZone }: { startedAt: string; timeZone: string }) {
  const t = useTranslations('professional.patients')
  const locale = useLocale()
  return <>{t('since', { date: formatShortDate(new Date(startedAt), timeZone, locale) })}</>
}
