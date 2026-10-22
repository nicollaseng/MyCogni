import {
  legalConsentKinds,
  legalVersion,
  type AccountFootprint,
  type AccountType,
} from '@mycogni/domain'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { profiles } from '../../db/schema/index.ts'

export interface ProfileRecord {
  id: string
  accountType: AccountType
  displayName: string | null
  avatarPath: string | null
  timezone: string
  locale: string | null
  journalInInsights: boolean
  memoriesEnabled: boolean
  termsOutdated: boolean
  onboardingCompletedAt: Date | null
}

export interface ProfileChanges {
  displayName?: string
  timezone?: string
  locale?: string
  journalInInsights?: boolean
  memoriesEnabled?: boolean
  avatarPath?: string | null
}

export interface AccountFootprintRecord extends AccountFootprint {
  accountType: AccountType
}

export interface ProfileRepository {
  findById(userId: string): Promise<ProfileRecord | undefined>
  footprint(userId: string): Promise<AccountFootprintRecord | undefined>
  adoptProfessional(userId: string): Promise<ProfileRecord | undefined>
  update(userId: string, changes: ProfileChanges): Promise<ProfileRecord | undefined>
  completeOnboarding(userId: string): Promise<ProfileRecord | undefined>
  setAvatarIfEmpty(userId: string, avatarPath: string): Promise<boolean>
}

const legalKinds = sql.join(
  legalConsentKinds.map((kind) => sql`${kind}`),
  sql`, `,
)

const profileId = sql`${sql.identifier('profiles')}.${sql.identifier('id')}`

const termsOutdated = sql<boolean>`exists (
  select 1 from public.consents previous
  where previous.user_id = ${profileId}
    and previous.kind in (${legalKinds})
    and previous.revoked_at is null
    and previous.version <> ${legalVersion}
    and not exists (
      select 1 from public.consents accepted
      where accepted.user_id = previous.user_id
        and accepted.kind = previous.kind
        and accepted.version = ${legalVersion}
        and accepted.revoked_at is null
    )
)`

export const profileColumns = {
  id: profiles.id,
  accountType: profiles.accountType,
  displayName: profiles.displayName,
  avatarPath: profiles.avatarPath,
  timezone: profiles.timezone,
  locale: profiles.locale,
  journalInInsights: profiles.journalInInsights,
  memoriesEnabled: profiles.memoriesEnabled,
  termsOutdated,
  onboardingCompletedAt: profiles.onboardingCompletedAt,
}

const hasRecords = sql<boolean>`exists (select 1 from public.consents r where r.user_id = ${profiles.id})
  or exists (select 1 from public.check_ins r where r.user_id = ${profiles.id})
  or exists (select 1 from public.assessments r where r.user_id = ${profiles.id})
  or exists (select 1 from public.journal_entries r where r.user_id = ${profiles.id})
  or exists (select 1 from public.professional_profiles r where r.user_id = ${profiles.id})
  or exists (select 1 from public.care_links r where r.patient_id = ${profiles.id})
  or exists (select 1 from public.invitations r where r.patient_id = ${profiles.id})`

async function findProfile(tx: Transaction, userId: string): Promise<ProfileRecord | undefined> {
  const [row] = await tx.select(profileColumns).from(profiles).where(eq(profiles.id, userId))
  return row
}

export function createProfileRepository(db: Database): ProfileRepository {
  return {
    findById(userId) {
      return withUser(db, userId, (tx) => findProfile(tx, userId))
    },
    footprint(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select({
            accountType: profiles.accountType,
            createdAt: profiles.createdAt,
            onboardingCompletedAt: profiles.onboardingCompletedAt,
            hasRecords,
          })
          .from(profiles)
          .where(eq(profiles.id, userId))
        return row
      })
    },
    adoptProfessional(userId) {
      return withUser(db, userId, async (tx) => {
        const [result] = await tx.execute<{ adopted: boolean }>(
          sql`select public.adopt_professional_account() as adopted`,
        )
        return result?.adopted === true ? findProfile(tx, userId) : undefined
      })
    },
    update(userId, changes) {
      return withUser(db, userId, async (tx) => {
        const resumed =
          changes.memoriesEnabled === true
            ? {
                memoriesReadUntil: sql`case when ${profiles.memoriesEnabled} then ${profiles.memoriesReadUntil} else now() end`,
              }
            : {}
        const [row] = await tx
          .update(profiles)
          .set({ ...changes, ...resumed })
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
    setAvatarIfEmpty(userId, avatarPath) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx
          .update(profiles)
          .set({ avatarPath })
          .where(and(eq(profiles.id, userId), isNull(profiles.avatarPath)))
          .returning({ id: profiles.id })
        return rows.length > 0
      })
    },
  }
}
