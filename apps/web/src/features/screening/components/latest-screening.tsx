import type { Assessment } from '@mycogni/contracts'
import { instrumentIds, instruments } from '@mycogni/domain'
import { Panel, Section } from '@/shared/components/section'
import { formatLongDate } from '@/shared/lib/time'
import { instrumentTopics, severityLabels } from '../copy'
import type { LatestResults } from '../latest'

interface LatestScreeningProps {
  results: LatestResults
  timeZone: string
}

function Row({ assessment }: { assessment: Assessment }) {
  return (
    <li className="py-3.5">
      <p className="text-sm text-muted-foreground">
        {instrumentTopics[assessment.instrument]}
        <span className="whitespace-nowrap"> · {instruments[assessment.instrument].name}</span>
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-serif text-[28px] leading-none">{assessment.totalScore}</span>
        <span className="text-sm text-muted-foreground">de {assessment.maxScore}</span>
        <span className="ml-auto text-right">{severityLabels[assessment.severity]}</span>
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
    <Section title="Seus questionários">
      {latest === undefined ? (
        <Panel>
          <p className="py-3.5 text-muted-foreground">
            Você ainda não respondeu o PHQ-9 e o GAD-7.
          </p>
        </Panel>
      ) : (
        <>
          <Panel>
            <ul>
              {answered.map((assessment) => (
                <Row key={assessment.id} assessment={assessment} />
              ))}
            </ul>
          </Panel>
          <p className="px-1 text-sm text-muted-foreground">
            Respondidos em {formatLongDate(new Date(latest.completedAt), timeZone).toLowerCase()}. É
            uma triagem, não um diagnóstico.
          </p>
        </>
      )}
    </Section>
  )
}
