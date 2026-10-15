import type { Assessment } from '@mycogni/contracts'
import { dayKey } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { formatDayMonth } from '@/shared/lib/time'

interface Session {
  key: string
  date: string
  scores: Assessment[]
}

function sessionsOf(assessments: readonly Assessment[], timeZone: string): Session[] {
  const sessions: Session[] = []
  for (const assessment of assessments) {
    const key = dayKey(new Date(assessment.completedAt), timeZone)
    const last = sessions.at(-1)
    if (last?.key === key) {
      last.scores.push(assessment)
    } else {
      sessions.push({ key, date: assessment.completedAt, scores: [assessment] })
    }
  }
  return sessions
}

const names = { phq9: 'PHQ-9', gad7: 'GAD-7' } as const

export function ScreeningHistory({
  assessments,
  timeZone,
}: {
  assessments: readonly Assessment[]
  timeZone: string
}) {
  const t = useTranslations('screening.history')
  const locale = useLocale()
  const sessions = sessionsOf(assessments, timeZone)
  if (sessions.length < 2) {
    return null
  }
  return (
    <div className="space-y-2 pt-2">
      <h3 className="text-sm text-muted-foreground">{t('title')}</h3>
      <ul className="space-y-1">
        {sessions.slice(0, 8).map((session) => (
          <li key={session.key} className="flex items-baseline justify-between gap-4 py-1">
            <span>{formatDayMonth(new Date(session.date), timeZone, locale)}</span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {session.scores
                .map((score) => `${names[score.instrument]} ${String(score.totalScore)}`)
                .join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
