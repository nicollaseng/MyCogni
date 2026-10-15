import type {
  CheckIn,
  CheckInAddendum,
  CheckInCount,
  CheckInDetail,
  CheckInFilter,
  CheckInSearch,
  CreateCheckInAddendumInput,
  CreateCheckInInput,
} from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import { NotFoundError } from '../../shared/errors.ts'
import type { CheckInAddendumRepository } from './check-in-addendum.repository.ts'
import { loadCheckInDetail, toAddendum } from './check-in-detail.ts'
import type {
  CheckInFilter as RecordFilter,
  CheckInRecord,
  CheckInRepository,
} from './check-in.repository.ts'

export interface CheckInService {
  record(user: AuthenticatedUser, input: CreateCheckInInput): Promise<CheckIn>
  list(user: AuthenticatedUser, search: CheckInSearch): Promise<CheckIn[]>
  count(user: AuthenticatedUser, filter: CheckInFilter): Promise<CheckInCount>
  detail(user: AuthenticatedUser, id: string): Promise<CheckInDetail>
  append(
    user: AuthenticatedUser,
    id: string,
    input: CreateCheckInAddendumInput,
  ): Promise<CheckInAddendum>
}

export function toCheckIn(record: CheckInRecord): CheckIn {
  return { ...record, recordedAt: record.recordedAt.toISOString() }
}

function optionalDate(value: string | undefined): Date | undefined {
  return value === undefined ? undefined : new Date(value)
}

function recordFilterOf({ since, ...filter }: CheckInFilter): RecordFilter {
  return { ...filter, since: optionalDate(since) }
}

export function createCheckInService(
  repository: CheckInRepository,
  jobs: JobScheduler,
  addenda: CheckInAddendumRepository,
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
    async list(user, { before, limit, ...filter }) {
      const records = await repository.list(user.id, user.id, {
        ...recordFilterOf(filter),
        before: optionalDate(before),
        limit,
      })
      return records.map(toCheckIn)
    },
    async count(user, filter) {
      return { count: await repository.count(user.id, recordFilterOf(filter)) }
    },
    detail(user, id) {
      return loadCheckInDetail(
        { checkIns: repository, addenda },
        { viewerId: user.id, ownerId: user.id, checkInId: id },
      )
    },
    async append(user, id, input) {
      const record = await repository.find(user.id, id)
      if (record?.userId !== user.id) {
        throw new NotFoundError('Check-in not found')
      }
      return toAddendum(await addenda.create(user.id, id, input.text))
    },
  }
}
