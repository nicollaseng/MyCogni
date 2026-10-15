import { eq } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { profiles } from '../../db/schema/index.ts'

export interface ProfileRecord {
  id: string
  displayName: string | null
  timezone: string
  onboardingCompletedAt: Date | null
}

export interface ProfileChanges {
  displayName?: string
  timezone?: string
}

export interface ProfileRepository {
  findById(userId: string): Promise<ProfileRecord | undefined>
  update(userId: string, changes: ProfileChanges): Promise<ProfileRecord | undefined>
}

const columns = {
  id: profiles.id,
  displayName: profiles.displayName,
  timezone: profiles.timezone,
  onboardingCompletedAt: profiles.onboardingCompletedAt,
}

export function createProfileRepository(db: Database): ProfileRepository {
  return {
    findById(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx.select(columns).from(profiles).where(eq(profiles.id, userId))
        return row
      })
    },
    update(userId, changes) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .update(profiles)
          .set(changes)
          .where(eq(profiles.id, userId))
          .returning(columns)
        return row
      })
    },
  }
}
