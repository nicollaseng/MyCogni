import type { Assessment } from '@mycogni/contracts'
import { instruments } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { crisisLinesFor } from '@/i18n/crisis-lines'
import { comparisonOf } from '../compare'
import { ScoreScale } from './score-scale'

export interface PreviousResults {
  depression?: Assessment
  anxiety?: Assessment
  timeZone: string
}

interface ResultProps {
  assessment: Assessment
  previous: Assessment | undefined
  timeZone: string | undefined
}

function Result({ assessment, previous, timeZone }: ResultProps) {
  const t = useTranslations('screening')
  const locale = useLocale()
  const instrument = instruments[assessment.instrument]
  const topic = t(`topics.${assessment.instrument}`)
  const comparison =
    previous === undefined || timeZone === undefined
      ? undefined
      : comparisonOf(assessment, previous, timeZone, locale)
  return (
    <section aria-label={topic}>
      <h2 className="text-sm text-muted-foreground">
        {topic}
        <span className="whitespace-nowrap"> · {instrument.name}</span>
      </h2>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="font-serif text-[34px] leading-none tracking-[-0.02em]">
          {assessment.totalScore}
        </span>
        <span className="text-sm text-muted-foreground">
          {t('score.outOf', { max: assessment.maxScore })}
        </span>
        <span className="ml-auto text-right text-sm font-medium">
          {t(`severity.${assessment.severity}`)}
        </span>
      </p>
      <ScoreScale instrument={instrument} score={assessment.totalScore} />
      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
        {t(`guidance.${assessment.severity}`)}
      </p>
      {comparison !== undefined && (
        <p className="mt-2 text-sm">
          {t(`comparison.${comparison.change}`, {
            points: comparison.points,
            day: comparison.day,
          })}
        </p>
      )}
    </section>
  )
}

function RiskNote() {
  const t = useTranslations('screening.results')
  const lines = crisisLinesFor(useLocale())
  return (
    <div className="space-y-1 border-l-2 border-help pl-4 text-sm leading-relaxed">
      <p>{t('risk')}</p>
      {lines.map((line) => (
        <p key={line.phone}>
          <a
            href={`tel:${line.phone}`}
            className="font-medium underline decoration-1 underline-offset-4"
          >
            {line.display}
          </a>{' '}
          <span className="text-muted-foreground">{line.description}</span>
        </p>
      ))}
    </div>
  )
}

interface ScreeningResultsProps {
  depression: Assessment
  anxiety: Assessment
  previous?: PreviousResults
}

export function ScreeningResults({ depression, anxiety, previous }: ScreeningResultsProps) {
  return (
    <div className="space-y-8">
      <Result
        assessment={depression}
        previous={previous?.depression}
        timeZone={previous?.timeZone}
      />
      <Result assessment={anxiety} previous={previous?.anxiety} timeZone={previous?.timeZone} />
      {depression.hasRiskFlag && <RiskNote />}
    </div>
  )
}
