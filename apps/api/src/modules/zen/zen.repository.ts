import { and, asc, eq } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { zenStepProgress } from '../../db/schema/index.ts'

export interface StepRecord {
  trackId: string
  stepId: string
  completedAt: Date
}

export interface StepKey {
  trackId: string
  stepId: string
}

export interface ZenRepository {
  list(userId: string): Promise<StepRecord[]>
  complete(userId: string, step: StepKey): Promise<StepRecord>
  undo(userId: string, step: StepKey): Promise<void>
}

const columns = {
  trackId: zenStepProgress.trackId,
  stepId: zenStepProgress.stepId,
  completedAt: zenStepProgress.completedAt,
}

function matching(userId: string, { trackId, stepId }: StepKey) {
  return and(
    eq(zenStepProgress.userId, userId),
    eq(zenStepProgress.trackId, trackId),
    eq(zenStepProgress.stepId, stepId),
  )
}

export function createZenRepository(db: Database): ZenRepository {
  return {
    list(userId) {
      return withUser(db, userId, (tx) =>
        tx
          .select(columns)
          .from(zenStepProgress)
          .where(eq(zenStepProgress.userId, userId))
          .orderBy(asc(zenStepProgress.completedAt)),
      )
    },
    complete(userId, step) {
      return withUser(db, userId, async (tx) => {
        await tx
          .insert(zenStepProgress)
          .values({ userId, ...step })
          .onConflictDoNothing()
        const [row] = await tx.select(columns).from(zenStepProgress).where(matching(userId, step))
        if (row === undefined) {
          throw new Error('Step progress was not saved')
        }
        return row
      })
    },
    async undo(userId, step) {
      await withUser(db, userId, (tx) => tx.delete(zenStepProgress).where(matching(userId, step)))
    },
  }
}
