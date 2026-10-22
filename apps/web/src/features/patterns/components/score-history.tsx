import type { Assessment } from '@mycogni/contracts'
import {
  domainOf,
  patternRules,
  plainLevelOf,
  plainLevelRank,
  plainLevels,
  plainTrendOf,
  scoreTimeline,
  screeningDomains,
  type PlainLevel,
  type ScreeningDomain,
} from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { formatShortDate } from '@/shared/lib/time'

const levelShades = [0, 0.035, 0.065, 0.095] as const

function topOf(level: PlainLevel): number {
  return (1 - (plainLevelRank(level) + 0.5) / plainLevels.length) * 100
}

interface LevelChartProps {
  domain: ScreeningDomain
  assessments: readonly Assessment[]
  timeZone: string
}

function LevelChart({ domain, assessments, timeZone }: LevelChartProps) {
  const t = useTranslations('patterns.scores')
  const plain = useTranslations('screening.plain')
  const locale = useLocale()
  const timeline = scoreTimeline(
    assessments.map((assessment) => ({
      ...assessment,
      completedAt: new Date(assessment.completedAt),
      level: plainLevelOf(assessment.severity),
    })),
    domain,
  )
  const latest = timeline.at(-1)
  const previous = timeline.at(-2)
  const first = timeline[0]?.completedAt.getTime() ?? 0
  const span = (latest?.completedAt.getTime() ?? first) - first
  const xOf = (date: Date) => (span === 0 ? 50 : 6 + ((date.getTime() - first) / span) * 88)
  const path = timeline
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${xOf(point.completedAt).toFixed(2)} ${topOf(point.level).toFixed(2)}`,
    )
    .join(' ')
  const pointText = (point: (typeof timeline)[number]) =>
    t('point', {
      date: formatShortDate(point.completedAt, timeZone, locale),
      level: plain(`levels.${point.level}`),
    })

  return (
    <figure className="space-y-3">
      <figcaption className="space-y-0.5">
        <span className="block font-medium">{plain(`names.${domain}`)}</span>
        {latest !== undefined && (
          <span className="block text-sm text-muted-foreground">
            {plain(`levels.${latest.level}`)}
            {previous !== undefined &&
              ` · ${plain(`trend.${plainTrendOf(latest.severity, previous.severity)}`)}`}
          </span>
        )}
      </figcaption>
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2">
        <div aria-hidden className="relative h-28 text-right text-[11px] text-muted-foreground">
          {plainLevels.map((level) => (
            <span
              key={level}
              className="absolute right-0 -translate-y-1/2 leading-none"
              style={{ top: `${String(topOf(level))}%` }}
            >
              {plain(`levels.${level}`)}
            </span>
          ))}
        </div>
        <div className="relative h-28">
          {plainLevels.map((level, index) => (
            <span
              key={level}
              aria-hidden
              data-level={level}
              className="absolute inset-x-0"
              style={{
                top: `${String(100 - ((index + 1) / plainLevels.length) * 100)}%`,
                height: `${String(100 / plainLevels.length)}%`,
                backgroundColor: `color-mix(in oklab, var(--foreground) ${String((levelShades[index] ?? 0) * 100)}%, transparent)`,
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
          {timeline.map((point) => (
            <span
              key={point.id}
              aria-hidden
              title={pointText(point)}
              className="absolute size-2.5 -translate-1/2 rounded-full bg-foreground ring-2 ring-background"
              style={{
                left: `${String(xOf(point.completedAt))}%`,
                top: `${String(topOf(point.level))}%`,
              }}
            />
          ))}
        </div>
        <span />
        <div aria-hidden className="flex justify-between pt-1.5 text-[11px] text-muted-foreground">
          <span>
            {formatShortDate(timeline[0]?.completedAt ?? new Date(first), timeZone, locale)}
          </span>
          <span>{formatShortDate(latest?.completedAt ?? new Date(first), timeZone, locale)}</span>
        </div>
      </div>
      <ul className="sr-only">
        {timeline.map((point) => (
          <li key={point.id}>{pointText(point)}</li>
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
  const shown = screeningDomains.filter(
    (domain) =>
      assessments.filter((assessment) => domainOf(assessment.instrument) === domain).length >=
      patternRules.minScoreSessions,
  )

  return (
    <Section title={t('title')}>
      <div className="grid gap-8 pt-1 md:grid-cols-2 md:gap-10">
        {shown.map((domain) => (
          <LevelChart key={domain} domain={domain} assessments={assessments} timeZone={timeZone} />
        ))}
      </div>
    </Section>
  )
}
