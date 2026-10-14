import { randomUUID } from 'node:crypto'
import { inArray, sql } from 'drizzle-orm'
import { authUsers } from 'drizzle-orm/supabase'
import type { Database } from '../../src/db/client.ts'

export const testDatabaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:55322/postgres'

export async function createAuthUser(
  db: Database,
  metadata: Record<string, string> = {},
): Promise<string> {
  const id = randomUUID()
  const email = `${id}@test.mycogni.local`
  await db.execute(
    sql`insert into auth.users (id, email, raw_user_meta_data) values (${id}, ${email}, ${JSON.stringify(metadata)}::jsonb)`,
  )
  return id
}

export async function deleteAuthUsers(db: Database, ids: string[]): Promise<void> {
  await db.delete(authUsers).where(inArray(authUsers.id, ids))
}
