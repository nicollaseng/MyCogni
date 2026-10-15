import type { Assessment } from '@mycogni/contracts'
import { instruments } from '@mycogni/domain'
import { Panel } from '@/shared/components/section'
import { comparedTo } from '../compare'
import { instrumentTopics, severityGuidance, severityLabels } from '../copy'
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
  const instrument = instruments[assessment.instrument]
  return (
    <Panel className="py-5">
      <section aria-label={instrumentTopics[assessment.instrument]}>
        <h2 className="text-sm text-muted-foreground">
          {instrumentTopics[assessment.instrument]}
          <span className="whitespace-nowrap"> · {instrument.name}</span>
        </h2>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="font-serif text-[34px] leading-none tracking-[-0.02em]">
            {assessment.totalScore}
          </span>
          <span className="text-sm text-muted-foreground">de {assessment.maxScore}</span>
          <span className="ml-auto text-right text-sm font-medium">
            {severityLabels[assessment.severity]}
          </span>
        </p>
        <ScoreScale instrument={instrument} score={assessment.totalScore} />
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          {severityGuidance[assessment.severity]}
        </p>
        {previous !== undefined && timeZone !== undefined && (
          <p className="mt-2 text-sm">{comparedTo(assessment, previous, timeZone)}</p>
        )}
      </section>
    </Panel>
  )
}

interface ScreeningResultsProps {
  depression: Assessment
  anxiety: Assessment
  previous?: PreviousResults
}

export function ScreeningResults({ depression, anxiety, previous }: ScreeningResultsProps) {
  return (
    <div className="space-y-3">
      <Result
        assessment={depression}
        previous={previous?.depression}
        timeZone={previous?.timeZone}
      />
      <Result assessment={anxiety} previous={previous?.anxiety} timeZone={previous?.timeZone} />
      {depression.hasRiskFlag && (
        <p className="border-l-2 border-help pl-4 text-sm leading-relaxed">
          Se pensar em se ferir de novo, ligue{' '}
          <a href="tel:188" className="font-medium underline decoration-1 underline-offset-4">
            188
          </a>{' '}
          (CVV, 24 horas) ou{' '}
          <a href="tel:192" className="font-medium underline decoration-1 underline-offset-4">
            192
          </a>{' '}
          em emergência.
        </p>
      )}
    </div>
  )
}
