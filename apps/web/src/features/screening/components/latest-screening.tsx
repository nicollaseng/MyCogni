import type { Assessment } from '@mycogni/contracts'
import { instrumentIds, instruments } from '@mycogni/domain'
import { formatLongDate } from '@/shared/lib/time'
import { instrumentTopics, severityLabels } from '../copy'
import type { LatestResults } from '../latest'

interface LatestScreeningProps {
  results: LatestResults
  timeZone: string
}

function Row({ assessment }: { assessment: Assessment }) {
  return (
    <li className="border-b border-rule py-3">
      <p className="text-sm">
        {instrumentTopics[assessment.instrument]}
        <span className="whitespace-nowrap text-muted-foreground">
          {' '}
          · {instruments[assessment.instrument].name}
        </span>
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-serif text-[26px] leading-none">{assessment.totalScore}</span>
        <span className="text-sm text-muted-foreground">de {assessment.maxScore}</span>
        <span className="ml-auto text-right text-sm">{severityLabels[assessment.severity]}</span>
      </p>
    </li>
  )
}

export function LatestScreening({ results, timeZone }: LatestScreeningProps) {
  const answered = instrumentIds.flatMap((id) => {
    const result = results[id]
    return result === undefined ? [] : [result]
  })
  const latest = answered.reduce<Assessment | undefined>(
    (newest, result) =>
      newest === undefined || result.completedAt > newest.completedAt ? result : newest,
    undefined,
  )

  return (
    <section aria-labelledby="latest-screening" className="space-y-4 border-t border-rule pt-8">
      <h2 id="latest-screening" className="text-xs tracking-[0.04em] text-muted-foreground">
        seus questionários
      </h2>
      {latest === undefined ? (
        <p className="text-muted-foreground">Você ainda não respondeu o PHQ-9 e o GAD-7.</p>
      ) : (
        <>
          <ul className="border-t border-rule">
            {answered.map((assessment) => (
              <Row key={assessment.id} assessment={assessment} />
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Respondidos em {formatLongDate(new Date(latest.completedAt), timeZone).toLowerCase()}. É
            uma triagem, não um diagnóstico.
          </p>
        </>
      )}
    </section>
  )
}
