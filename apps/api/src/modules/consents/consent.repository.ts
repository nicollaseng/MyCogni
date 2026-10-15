import type { ConsentKind } from '@mycogni/domain'
import { and, asc, eq } from 'drizzle-orm'
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
  grant(userId: string, kinds: readonly ConsentKind[], version: string): Promise<void>
}

export function createConsentRepository(db: Database): ConsentRepository {
  return {
    findGranted(userId, version) {
      return withUser(db, userId, (tx) =>
        tx
          .select({ kind: consents.kind, version: consents.version, grantedAt: consents.grantedAt })
          .from(consents)
          .where(and(eq(consents.userId, userId), eq(consents.version, version)))
          .orderBy(asc(consents.grantedAt), asc(consents.kind)),
      )
    },
    grant(userId, kinds, version) {
      return withUser(db, userId, async (tx) => {
        await tx
          .insert(consents)
          .values(kinds.map((kind) => ({ userId, kind, version })))
          .onConflictDoNothing()
      })
    },
  }
}
