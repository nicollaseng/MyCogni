import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq, inArray } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { checkIns } from '../../src/db/schema/index.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

describe('check_ins', () => {
  let connection: DatabaseConnection
  let alice: string
  let bob: string

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    alice = await createAuthUser(connection.db)
    bob = await createAuthUser(connection.db)
    await connection.db.insert(checkIns).values([
      { userId: alice, moodLevel: 2, note: 'da Alice' },
      { userId: bob, moodLevel: 5, note: 'do Bob' },
    ])
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [alice, bob])
    await connection.close()
  })

  it('lets a user read only their own records', async () => {
    const rows = await withUser(connection.db, alice, (tx) => tx.select().from(checkIns))

    expect(rows.map((row) => row.note)).toEqual(['da Alice'])
  })

  it('does not let a user write a record for someone else', async () => {
    const attempt = withUser(connection.db, alice, (tx) =>
      tx.insert(checkIns).values({ userId: bob, moodLevel: 0 }),
    )

    await expect(attempt).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let anyone rewrite or erase records yet', async () => {
    const [updated, deleted] = await withUser(connection.db, alice, async (tx) => [
      await tx.update(checkIns).set({ moodLevel: 6 }).where(eq(checkIns.userId, alice)).returning(),
      await tx.delete(checkIns).where(eq(checkIns.userId, alice)).returning(),
    ])

    expect(updated).toHaveLength(0)
    expect(deleted).toHaveLength(0)
  })

  it('refuses a mood outside the scale even from the database', async () => {
    const attempt = connection.db.insert(checkIns).values({ userId: alice, moodLevel: 9 })

    await expect(attempt).rejects.toMatchObject({ cause: { code: '23514' } })
  })

  it('removes the records when the account is deleted', async () => {
    const carol = await createAuthUser(connection.db)
    await connection.db.insert(checkIns).values({ userId: carol, moodLevel: 3 })

    await deleteAuthUsers(connection.db, [carol])

    const left = await connection.db
      .select()
      .from(checkIns)
      .where(inArray(checkIns.userId, [carol]))
    expect(left).toHaveLength(0)
  })
})
