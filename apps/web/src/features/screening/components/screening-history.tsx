import type { Assessment } from '@mycogni/contracts'
import {
  dayKey,
  domainOf,
  plainLevelOf,
  screeningDomains,
  type ScreeningDomain,
} from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId } from 'react'
import { formatDayMonth } from '@/shared/lib/time'

interface Session {
  key: string
  date: string
  answers: Partial<Record<ScreeningDomain, Assessment>>
}

function sessionsOf(assessments: readonly Assessment[], timeZone: string): Session[] {
  const sessions: Session[] = []
  const newestFirst = [...assessments].sort((first, second) =>
    second.completedAt.localeCompare(first.completedAt),
  )
  for (const assessment of newestFirst) {
    const key = dayKey(new Date(assessment.completedAt), timeZone)
    const last = sessions.at(-1)
    const domain = domainOf(assessment.instrument)
    if (last?.key === key) {
      last.answers[domain] ??= assessment
    } else {
      sessions.push({ key, date: assessment.completedAt, answers: { [domain]: assessment } })
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
            {screeningDomains.map((domain) => (
              <th key={domain} scope="col" className="pb-1 font-normal">
                {plain(`names.${domain}`)}
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
              {screeningDomains.map((domain) => {
                const answer = session.answers[domain]
                return (
                  <td key={domain} className="py-1.5 text-sm text-muted-foreground">
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
