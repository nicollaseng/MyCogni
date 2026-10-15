import { eq, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { profiles } from '../../db/schema/index.ts'

export interface ProfileRecord {
  id: string
  displayName: string | null
  avatarPath: string | null
  timezone: string
  locale: string | null
  onboardingCompletedAt: Date | null
}

export interface ProfileChanges {
  displayName?: string
  timezone?: string
  locale?: string
  avatarPath?: string | null
}

export interface ProfileRepository {
  findById(userId: string): Promise<ProfileRecord | undefined>
  update(userId: string, changes: ProfileChanges): Promise<ProfileRecord | undefined>
  completeOnboarding(userId: string): Promise<ProfileRecord | undefined>
}

export const profileColumns = {
  id: profiles.id,
  displayName: profiles.displayName,
  avatarPath: profiles.avatarPath,
  timezone: profiles.timezone,
  locale: profiles.locale,
  onboardingCompletedAt: profiles.onboardingCompletedAt,
}

export function createProfileRepository(db: Database): ProfileRepository {
  return {
    findById(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx.select(profileColumns).from(profiles).where(eq(profiles.id, userId))
        return row
      })
    },
    update(userId, changes) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .update(profiles)
          .set(changes)
          .where(eq(profiles.id, userId))
          .returning(profileColumns)
        return row
      })
    },
    completeOnboarding(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .update(profiles)
          .set({ onboardingCompletedAt: sql`coalesce(${profiles.onboardingCompletedAt}, now())` })
          .where(eq(profiles.id, userId))
          .returning(profileColumns)
        return row
      })
    },
  }
}
