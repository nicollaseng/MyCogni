import { and, eq, lte, sql } from 'drizzle-orm'
import type { Database } from '../db/client.ts'
import { invitations } from '../db/schema/index.ts'

export async function expireInvitations(db: Database): Promise<number> {
  const rows = await db
    .update(invitations)
    .set({ status: 'expired' })
    .where(and(eq(invitations.status, 'pending'), lte(invitations.expiresAt, sql`now()`)))
    .returning({ id: invitations.id })
  return rows.length
}
