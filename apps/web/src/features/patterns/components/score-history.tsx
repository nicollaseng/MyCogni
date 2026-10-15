import type { Assessment } from '@mycogni/contracts'
import {
  instrumentIds,
  instruments,
  maxScoreOf,
  patternRules,
  scoreTimeline,
  type InstrumentId,
} from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { formatShortDate } from '@/shared/lib/time'

const bandShades = [0, 0.03, 0.055, 0.08, 0.105] as const

interface ScoreChartProps {
  instrument: InstrumentId
  assessments: readonly Assessment[]
  timeZone: string
}

function ScoreChart({ instrument: id, assessments, timeZone }: ScoreChartProps) {
  const t = useTranslations('patterns.scores')
  const screening = useTranslations('screening')
  const locale = useLocale()
  const instrument = instruments[id]
  const max = maxScoreOf(instrument)
  const timeline = scoreTimeline(
    assessments.map((assessment) => ({
      ...assessment,
      completedAt: new Date(assessment.completedAt),
    })),
    id,
  )
  const latest = timeline.at(-1)
  const first = timeline[0]?.completedAt.getTime() ?? 0
  const span = (latest?.completedAt.getTime() ?? first) - first
  const xOf = (date: Date) => (span === 0 ? 50 : 6 + ((date.getTime() - first) / span) * 88)
  const yOf = (score: number) => (1 - score / max) * 100
  const bands = instrument.bands.map((band, index) => ({
    severity: band.severity,
    lower: band.min,
    upper: instrument.bands[index + 1]?.min ?? max,
    shade: bandShades[index] ?? 0,
  }))
  const pointText = (score: (typeof timeline)[number]) =>
    t('point', {
      date: formatShortDate(score.completedAt, timeZone, locale),
      score: score.totalScore,
      max,
      severity: screening(`severity.${score.severity}`).toLocaleLowerCase(locale),
    })
  const path = timeline
    .map(
      (score, index) =>
        `${index === 0 ? 'M' : 'L'}${xOf(score.completedAt).toFixed(2)} ${yOf(score.totalScore).toFixed(2)}`,
    )
    .join(' ')

  return (
    <figure className="space-y-3">
      <figcaption className="space-y-0.5">
        <span className="block font-medium">
          {instrument.name} · {screening(`topics.${id}`)}
        </span>
        <span className="block text-sm text-muted-foreground">
          {latest === undefined
            ? t('empty')
            : t('latest', {
                score: latest.totalScore,
                max,
                severity: screening(`severity.${latest.severity}`).toLocaleLowerCase(locale),
              })}
        </span>
      </figcaption>
      {latest !== undefined && timeline.length < patternRules.minScoreSessions && (
        <p className="text-sm text-muted-foreground">{t('single')}</p>
      )}
      {timeline.length >= patternRules.minScoreSessions && (
        <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
          <div aria-hidden className="relative h-32 text-right text-[10px] text-muted-foreground">
            {[...bands.map((band) => band.lower), max].map((tick) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2 leading-none tabular-nums"
                style={{ top: `${String(yOf(tick))}%` }}
              >
                {tick}
              </span>
            ))}
          </div>
          <div className="relative h-32">
            {bands.map((band) => (
              <span
                key={band.severity}
                aria-hidden
                data-severity={band.severity}
                className="absolute inset-x-0"
                style={{
                  top: `${String(yOf(band.upper))}%`,
                  height: `${String(((band.upper - band.lower) / max) * 100)}%`,
                  backgroundColor: `color-mix(in oklab, var(--foreground) ${String(band.shade * 100)}%, transparent)`,
                }}
              />
            ))}
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
            >
              <path
                d={path}
                fill="none"
                stroke="var(--muted-foreground)"
                strokeOpacity={0.6}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {timeline.map((score) => (
              <span
                key={score.id}
                title={pointText(score)}
                className="absolute size-2.5 -translate-1/2 rounded-full bg-foreground ring-2 ring-background"
                style={{
                  left: `${String(xOf(score.completedAt))}%`,
                  top: `${String(yOf(score.totalScore))}%`,
                }}
              />
            ))}
          </div>
          <span />
          <div
            aria-hidden
            className="flex justify-between pt-1.5 text-[11px] text-muted-foreground"
          >
            <span>
              {formatShortDate(timeline[0]?.completedAt ?? new Date(first), timeZone, locale)}
            </span>
            <span>{formatShortDate(latest?.completedAt ?? new Date(first), timeZone, locale)}</span>
          </div>
        </div>
      )}
      <ul className="sr-only">
        {timeline.map((score) => (
          <li key={score.id}>{pointText(score)}</li>
        ))}
      </ul>
    </figure>
  )
}

export function ScoreHistory({
  assessments,
  timeZone,
}: {
  assessments: readonly Assessment[]
  timeZone: string
}) {
  const t = useTranslations('patterns.scores')

  return (
    <div className="space-y-6 pt-1">
      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        {instrumentIds.map((id) => (
          <ScoreChart key={id} instrument={id} assessments={assessments} timeZone={timeZone} />
        ))}
      </div>
      <p className="text-sm text-pretty text-muted-foreground">{t('note')}</p>
    </div>
  )
}
