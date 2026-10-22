import type { PracticeKind } from '@mycogni/domain'
import { and, desc, eq, gte } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { zenSessions } from '../../db/schema/index.ts'

export interface SessionRecord {
  id: string
  kind: PracticeKind
  contentId: string
  startedAt: Date
  secondsCompleted: number
  completed: boolean
  feelingAfter: number | null
}

export interface NewSession {
  kind: PracticeKind
  contentId: string
  startedAt: Date
  secondsCompleted: number
  completed: boolean
  feelingAfter: number | null
}

export interface ZenSessionRepository {
  record(userId: string, session: NewSession): Promise<SessionRecord>
  list(userId: string, since: Date, limit: number): Promise<SessionRecord[]>
  feel(userId: string, id: string, feelingAfter: number): Promise<boolean>
}

export const sessionColumns = {
  id: zenSessions.id,
  kind: zenSessions.kind,
  contentId: zenSessions.contentId,
  startedAt: zenSessions.startedAt,
  secondsCompleted: zenSessions.secondsCompleted,
  completed: zenSessions.completed,
  feelingAfter: zenSessions.feelingAfter,
}

export function createZenSessionRepository(db: Database): ZenSessionRepository {
  return {
    record(userId, session) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(zenSessions)
          .values({ userId, ...session })
          .returning(sessionColumns)
        if (row === undefined) {
          throw new Error('Zen session was not saved')
        }
        return row
      })
    },
    list(userId, since, limit) {
      return withUser(db, userId, (tx) =>
        tx
          .select(sessionColumns)
          .from(zenSessions)
          .where(and(eq(zenSessions.userId, userId), gte(zenSessions.startedAt, since)))
          .orderBy(desc(zenSessions.startedAt))
          .limit(limit),
      )
    },
    feel(userId, id, feelingAfter) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx
          .update(zenSessions)
          .set({ feelingAfter })
          .where(and(eq(zenSessions.id, id), eq(zenSessions.userId, userId)))
          .returning({ id: zenSessions.id })
        return rows.length > 0
      })
    },
  }
}
