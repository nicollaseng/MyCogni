import type {
  CheckIn,
  CheckInCount,
  CheckInDetail,
  CheckInFilter,
  CheckInSearch,
  CreateCheckInAddendumInput,
  CreateCheckInInput,
  RecordedAddendum,
  RecordedCheckIn,
} from '@mycogni/contracts'
import { noteRisk } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import { NotFoundError } from '../../shared/errors.ts'
import type { NoteSafety } from '../safety/note-safety.ts'
import type { CheckInAddendumRepository } from './check-in-addendum.repository.ts'
import { loadCheckInDetail, toAddendum } from './check-in-detail.ts'
import type {
  CheckInFilter as RecordFilter,
  CheckInRecord,
  CheckInRepository,
} from './check-in.repository.ts'

export interface CheckInService {
  record(user: AuthenticatedUser, input: CreateCheckInInput): Promise<RecordedCheckIn>
  list(user: AuthenticatedUser, search: CheckInSearch): Promise<CheckIn[]>
  count(user: AuthenticatedUser, filter: CheckInFilter): Promise<CheckInCount>
  detail(user: AuthenticatedUser, id: string): Promise<CheckInDetail>
  append(
    user: AuthenticatedUser,
    id: string,
    input: CreateCheckInAddendumInput,
  ): Promise<RecordedAddendum>
}

export interface CheckInServiceDependencies {
  checkIns: CheckInRepository
  addenda: CheckInAddendumRepository
  jobs: JobScheduler
  safety: NoteSafety
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

export function createCheckInService({
  checkIns: repository,
  addenda,
  jobs,
  safety,
}: CheckInServiceDependencies): CheckInService {
  return {
    async record(user, input) {
      const note = input.note === null || input.note === '' ? null : input.note
      const record = await repository.create(user.id, {
        moodLevel: input.moodLevel,
        emotions: [...new Set(input.emotions)],
        contexts: [...new Set(input.contexts)],
        note,
      })
      await jobs.checkInRecorded(user.id)
      if (note !== null) {
        await jobs.memorySourceSaved(user.id)
      }
      const support = await safety.review(
        { kind: 'check_in', patientId: user.id, checkInId: record.id },
        noteRisk(note),
      )
      return { ...toCheckIn(record), support }
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
      const addendum = await addenda.create(user.id, id, input.text)
      await jobs.memorySourceSaved(user.id)
      const support = await safety.review(
        { kind: 'addendum', patientId: user.id, checkInId: id, addendumId: addendum.id },
        noteRisk(input.text),
      )
      return { ...toAddendum(addendum), support }
    },
  }
}
