import { sql } from 'drizzle-orm'
import type { Database, Transaction } from './client.ts'

export function withUser<T>(
  db: Database,
  userId: string,
  work: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const claims = JSON.stringify({ sub: userId, role: 'authenticated' })
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${claims}, true), set_config('role', 'authenticated', true)`,
    )
    return work(tx)
  })
}

export function asAnonymous<T>(db: Database, work: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role anon`)
    return work(tx)
  })
}
