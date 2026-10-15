import type { CheckIn, CheckInQuery, CreateCheckInInput } from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import type { CheckInRecord, CheckInRepository } from './check-in.repository.ts'

export interface CheckInService {
  record(user: AuthenticatedUser, input: CreateCheckInInput): Promise<CheckIn>
  list(user: AuthenticatedUser, query: CheckInQuery): Promise<CheckIn[]>
}

export function toCheckIn(record: CheckInRecord): CheckIn {
  return { ...record, recordedAt: record.recordedAt.toISOString() }
}

function optionalDate(value: string | undefined): Date | undefined {
  return value === undefined ? undefined : new Date(value)
}

export function createCheckInService(
  repository: CheckInRepository,
  jobs: JobScheduler,
): CheckInService {
  return {
    async record(user, input) {
      const record = await repository.create(user.id, {
        moodLevel: input.moodLevel,
        emotions: [...new Set(input.emotions)],
        contexts: [...new Set(input.contexts)],
        note: input.note === null || input.note === '' ? null : input.note,
      })
      await jobs.checkInRecorded(user.id)
      return toCheckIn(record)
    },
    async list(user, query) {
      const records = await repository.list(user.id, user.id, {
        since: optionalDate(query.since),
        before: optionalDate(query.before),
        limit: query.limit,
      })
      return records.map(toCheckIn)
    },
  }
}
