import type { AccountType } from '@mycogni/domain'
import { eq } from 'drizzle-orm'
import type { Database } from '../db/client.ts'
import { withUser } from '../db/rls.ts'
import { profiles } from '../db/schema/index.ts'

export interface AccountTypeReader {
  typeOf(userId: string): Promise<AccountType | undefined>
}

export function createAccountTypeReader(db: Database): AccountTypeReader {
  return {
    typeOf(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select({ accountType: profiles.accountType })
          .from(profiles)
          .where(eq(profiles.id, userId))
        return row?.accountType
      })
    },
  }
}
