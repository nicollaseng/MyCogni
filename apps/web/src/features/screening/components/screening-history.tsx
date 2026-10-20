import type { Assessment } from '@mycogni/contracts'
import { dayKey, instrumentIds, plainLevelOf, type InstrumentId } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId } from 'react'
import { formatDayMonth } from '@/shared/lib/time'

interface Session {
  key: string
  date: string
  answers: Partial<Record<InstrumentId, Assessment>>
}

function sessionsOf(assessments: readonly Assessment[], timeZone: string): Session[] {
  const sessions: Session[] = []
  const newestFirst = [...assessments].sort((first, second) =>
    second.completedAt.localeCompare(first.completedAt),
  )
  for (const assessment of newestFirst) {
    const key = dayKey(new Date(assessment.completedAt), timeZone)
    const last = sessions.at(-1)
    if (last?.key === key) {
      last.answers[assessment.instrument] ??= assessment
    } else {
      sessions.push({
        key,
        date: assessment.completedAt,
        answers: { [assessment.instrument]: assessment },
      })
    }
  }
  return sessions
}

export function ScreeningHistory({
  assessments,
  timeZone,
}: {
  assessments: readonly Assessment[]
  timeZone: string
}) {
  const t = useTranslations('screening.history')
  const plain = useTranslations('screening.plain')
  const locale = useLocale()
  const titleId = useId()
  const sessions = sessionsOf(assessments, timeZone)
  if (sessions.length < 2) {
    return null
  }
  return (
    <div className="space-y-2 pt-2">
      <h3 id={titleId} className="text-sm text-muted-foreground">
        {t('title')}
      </h3>
      <table aria-labelledby={titleId} className="w-full text-left">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="sr-only">
              {t('day')}
            </th>
            {instrumentIds.map((id) => (
              <th key={id} scope="col" className="pb-1 font-normal">
                {plain(`names.${id}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.slice(0, 8).map((session) => (
            <tr key={session.key}>
              <th scope="row" className="py-1.5 pr-4 font-normal">
                {formatDayMonth(new Date(session.date), timeZone, locale)}
              </th>
              {instrumentIds.map((id) => {
                const answer = session.answers[id]
                return (
                  <td key={id} className="py-1.5 text-sm text-muted-foreground">
                    {answer === undefined ? '–' : plain(`levels.${plainLevelOf(answer.severity)}`)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
