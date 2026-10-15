import { and, desc, eq, gte, lt } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { checkIns } from '../../db/schema/index.ts'

export interface CheckInRecord {
  id: string
  moodLevel: number
  emotions: string[]
  contexts: string[]
  note: string | null
  recordedAt: Date
}

export type NewCheckIn = Omit<CheckInRecord, 'id' | 'recordedAt'>

export interface CheckInWindow {
  since?: Date
  before?: Date
  limit: number
}

export interface CheckInRepository {
  create(userId: string, checkIn: NewCheckIn): Promise<CheckInRecord>
  list(viewerId: string, ownerId: string, window: CheckInWindow): Promise<CheckInRecord[]>
}

const columns = {
  id: checkIns.id,
  moodLevel: checkIns.moodLevel,
  emotions: checkIns.emotions,
  contexts: checkIns.contexts,
  note: checkIns.note,
  recordedAt: checkIns.recordedAt,
}

export function createCheckInRepository(db: Database): CheckInRepository {
  return {
    create(userId, checkIn) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(checkIns)
          .values({ ...checkIn, userId })
          .returning(columns)
        if (row === undefined) {
          throw new Error('Check-in was not saved')
        }
        return row
      })
    },
    list(viewerId, ownerId, { since, before, limit }) {
      return withUser(db, viewerId, (tx) =>
        tx
          .select(columns)
          .from(checkIns)
          .where(
            and(
              eq(checkIns.userId, ownerId),
              since === undefined ? undefined : gte(checkIns.recordedAt, since),
              before === undefined ? undefined : lt(checkIns.recordedAt, before),
            ),
          )
          .orderBy(desc(checkIns.recordedAt))
          .limit(limit),
      )
    },
  }
}
