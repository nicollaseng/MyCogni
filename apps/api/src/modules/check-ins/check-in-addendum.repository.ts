import { asc, eq } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { checkInAddenda } from '../../db/schema/index.ts'

export interface AddendumRecord {
  id: string
  text: string
  createdAt: Date
}

export interface CheckInAddendumRepository {
  list(viewerId: string, checkInId: string): Promise<AddendumRecord[]>
  create(userId: string, checkInId: string, text: string): Promise<AddendumRecord>
}

const columns = {
  id: checkInAddenda.id,
  text: checkInAddenda.text,
  createdAt: checkInAddenda.createdAt,
}

export function createCheckInAddendumRepository(db: Database): CheckInAddendumRepository {
  return {
    list(viewerId, checkInId) {
      return withUser(db, viewerId, (tx) =>
        tx
          .select(columns)
          .from(checkInAddenda)
          .where(eq(checkInAddenda.checkInId, checkInId))
          .orderBy(asc(checkInAddenda.createdAt), asc(checkInAddenda.id)),
      )
    },
    create(userId, checkInId, text) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(checkInAddenda)
          .values({ checkInId, userId, text })
          .returning(columns)
        if (row === undefined) {
          throw new Error('Addendum was not saved')
        }
        return row
      })
    },
  }
}
