import {
  consentVersion,
  consentVersionOf,
  legalConsentKinds,
  legalVersion,
  type ConsentKind,
} from '@mycogni/domain'
import { and, asc, eq, inArray, isNull, notInArray, or, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { consents } from '../../db/schema/index.ts'

export interface ConsentRecord {
  kind: ConsentKind
  version: string
  grantedAt: Date
}

export interface ConsentRepository {
  findGranted(userId: string, version: string): Promise<ConsentRecord[]>
  findCurrent(userId: string): Promise<ConsentRecord[]>
  grant(userId: string, kinds: readonly ConsentKind[]): Promise<void>
  revoke(userId: string, kind: ConsentKind, version: string): Promise<boolean>
}

export function createConsentRepository(db: Database): ConsentRepository {
  return {
    findGranted(userId, version) {
      return withUser(db, userId, (tx) =>
        tx
          .select({ kind: consents.kind, version: consents.version, grantedAt: consents.grantedAt })
          .from(consents)
          .where(
            and(
              eq(consents.userId, userId),
              eq(consents.version, version),
              isNull(consents.revokedAt),
            ),
          )
          .orderBy(asc(consents.grantedAt), asc(consents.kind)),
      )
    },
    findCurrent(userId) {
      return withUser(db, userId, (tx) =>
        tx
          .select({ kind: consents.kind, version: consents.version, grantedAt: consents.grantedAt })
          .from(consents)
          .where(
            and(
              eq(consents.userId, userId),
              isNull(consents.revokedAt),
              or(
                and(
                  inArray(consents.kind, [...legalConsentKinds]),
                  eq(consents.version, legalVersion),
                ),
                and(
                  notInArray(consents.kind, [...legalConsentKinds]),
                  eq(consents.version, consentVersion),
                ),
              ),
            ),
          )
          .orderBy(asc(consents.grantedAt), asc(consents.kind)),
      )
    },
    grant(userId, kinds) {
      return withUser(db, userId, async (tx) => {
        await tx
          .insert(consents)
          .values(kinds.map((kind) => ({ userId, kind, version: consentVersionOf(kind) })))
          .onConflictDoUpdate({
            target: [consents.userId, consents.kind, consents.version],
            set: { revokedAt: null, grantedAt: sql`now()` },
            setWhere: sql`${consents.revokedAt} is not null`,
          })
      })
    },
    revoke(userId, kind, version) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx
          .update(consents)
          .set({ revokedAt: sql`now()` })
          .where(
            and(
              eq(consents.userId, userId),
              eq(consents.kind, kind),
              eq(consents.version, version),
              isNull(consents.revokedAt),
            ),
          )
          .returning({ kind: consents.kind })
        return rows.length > 0
      })
    },
  }
}
