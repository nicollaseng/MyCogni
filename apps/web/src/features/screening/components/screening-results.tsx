import type { Assessment } from '@mycogni/contracts'
import { crisisLinesFor } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { plainResultOf, type LatestResults, type PlainResult } from '../latest'
import { PlainScale } from './plain-scale'

function Result({ result }: { result: PlainResult }) {
  const t = useTranslations('screening')
  const name = t(`plain.names.${result.assessment.instrument}`)
  return (
    <section aria-label={name}>
      <h2 className="text-sm text-muted-foreground">{name}</h2>
      <p className="mt-2 font-serif text-[34px] leading-none tracking-[-0.02em]">
        {t(`plain.levels.${result.level}`)}
      </p>
      <PlainScale level={result.level} className="mt-4 max-w-60" />
      <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
        {t(`guidance.${result.assessment.severity}`)}
      </p>
      {result.trend !== null && <p className="mt-2 text-sm">{t(`plain.trend.${result.trend}`)}</p>}
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
  previous?: LatestResults
}

export function ScreeningResults({ depression, anxiety, previous = {} }: ScreeningResultsProps) {
  return (
    <div className="space-y-8">
      <Result result={plainResultOf(depression, previous.phq9)} />
      <Result result={plainResultOf(anxiety, previous.gad7)} />
      {depression.hasRiskFlag && <RiskNote />}
    </div>
  )
}
