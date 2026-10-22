import type { RecordZenSessionInput, ZenSession, ZenSessionFeeling } from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError } from '../../shared/errors.ts'
import type { SessionRecord, ZenSessionRepository } from './zen-sessions.repository.ts'

export interface ZenSessionService {
  record(user: AuthenticatedUser, input: RecordZenSessionInput): Promise<ZenSession>
  list(user: AuthenticatedUser, since: string): Promise<ZenSession[]>
  feel(user: AuthenticatedUser, id: string, input: ZenSessionFeeling): Promise<void>
}

const listLimit = 1000

export function toZenSession(record: SessionRecord): ZenSession {
  return {
    id: record.id,
    kind: record.kind,
    contentId: record.contentId,
    startedAt: record.startedAt.toISOString(),
    seconds: record.secondsCompleted,
    completed: record.completed,
    feelingAfter: record.feelingAfter,
  }
}

export function createZenSessionService(repository: ZenSessionRepository): ZenSessionService {
  return {
    async record(user, input) {
      const record = await repository.record(user.id, {
        kind: input.kind,
        contentId: input.contentId,
        startedAt: new Date(input.startedAt),
        secondsCompleted: input.seconds,
        completed: input.completed,
        feelingAfter: input.feelingAfter,
      })
      return toZenSession(record)
    },
    async list(user, since) {
      const records = await repository.list(user.id, new Date(since), listLimit)
      return records.map(toZenSession)
    },
    async feel(user, id, { feelingAfter }) {
      if (!(await repository.feel(user.id, id, feelingAfter))) {
        throw new NotFoundError('Session not found')
      }
    },
  }
}
