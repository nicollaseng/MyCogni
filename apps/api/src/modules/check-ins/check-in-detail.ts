import type { CheckInAddendum, CheckInDetail } from '@mycogni/contracts'
import { NotFoundError } from '../../shared/errors.ts'
import type { AddendumRecord, CheckInAddendumRepository } from './check-in-addendum.repository.ts'
import type { CheckInRepository } from './check-in.repository.ts'

export interface CheckInDetailSources {
  checkIns: CheckInRepository
  addenda: CheckInAddendumRepository
}

export function toAddendum(record: AddendumRecord): CheckInAddendum {
  return { id: record.id, text: record.text, createdAt: record.createdAt.toISOString() }
}

export async function loadCheckInDetail(
  { checkIns, addenda }: CheckInDetailSources,
  { viewerId, ownerId, checkInId }: { viewerId: string; ownerId: string; checkInId: string },
): Promise<CheckInDetail> {
  const record = await checkIns.find(viewerId, checkInId)
  if (record?.userId !== ownerId) {
    throw new NotFoundError('Check-in not found')
  }
  return {
    id: record.id,
    moodLevel: record.moodLevel,
    emotions: record.emotions,
    contexts: record.contexts,
    note: record.note,
    recordedAt: record.recordedAt.toISOString(),
    addenda: (await addenda.list(viewerId, checkInId)).map(toAddendum),
  }
}
