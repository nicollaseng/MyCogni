import type { ZenSession } from '@mycogni/contracts'
import type { PracticeSession } from '@mycogni/domain'

const dayMs = 24 * 60 * 60 * 1000

export function practiceSince(now: Date, weeks: number): Date {
  return new Date(now.getTime() - (weeks * 7 + 7) * dayMs)
}

export function toPracticeSessions(sessions: readonly ZenSession[]): PracticeSession[] {
  return sessions.map(({ kind, contentId, startedAt, seconds, completed, feelingAfter }) => ({
    kind,
    contentId,
    startedAt,
    seconds,
    completed,
    feelingAfter,
  }))
}
