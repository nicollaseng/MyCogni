import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq, inArray } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { assessments, consents } from '../../src/db/schema/index.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

const screening: Omit<typeof assessments.$inferInsert, 'userId'> = {
  instrument: 'gad7',
  answers: [1, 1, 1, 1, 1, 1, 1],
  totalScore: 7,
  severity: 'mild',
  hasRiskFlag: false,
}

describe('consents and assessments', () => {
  let connection: DatabaseConnection
  let alice: string
  let bob: string

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    alice = await createAuthUser(connection.db)
    bob = await createAuthUser(connection.db)
    await connection.db.insert(consents).values([
      { userId: alice, kind: 'terms', version: '2026-10' },
      { userId: bob, kind: 'terms', version: '2026-10' },
    ])
    await connection.db.insert(assessments).values([
      { ...screening, userId: alice },
      { ...screening, userId: bob },
    ])
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [alice, bob])
    await connection.close()
  })

  it('lets a user read only their own consents and results', async () => {
    const [ownConsents, ownResults] = await withUser(connection.db, alice, (tx) =>
      Promise.all([tx.select().from(consents), tx.select().from(assessments)]),
    )

    expect(ownConsents.map((row) => row.userId)).toEqual([alice])
    expect(ownResults.map((row) => row.userId)).toEqual([alice])
  })

  it('does not let a user record a consent for someone else', async () => {
    const attempt = withUser(connection.db, alice, (tx) =>
      tx.insert(consents).values({ userId: bob, kind: 'privacy', version: '2026-10' }),
    )

    await expect(attempt).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let a user record a result for someone else', async () => {
    const attempt = withUser(connection.db, alice, (tx) =>
      tx.insert(assessments).values({ ...screening, userId: bob }),
    )

    await expect(attempt).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let a user rewrite or erase their results', async () => {
    const [updated, deleted] = await withUser(connection.db, alice, async (tx) => [
      await tx
        .update(assessments)
        .set({ totalScore: 0, severity: 'minimal' })
        .where(eq(assessments.userId, alice))
        .returning(),
      await tx.delete(assessments).where(eq(assessments.userId, alice)).returning(),
    ])

    expect(updated).toHaveLength(0)
    expect(deleted).toHaveLength(0)
  })

  it('does not let a user withdraw a consent by erasing it', async () => {
    const deleted = await withUser(connection.db, alice, (tx) =>
      tx.delete(consents).where(eq(consents.userId, alice)).returning(),
    )

    expect(deleted).toHaveLength(0)
  })

  it('removes consents and results when the account is deleted', async () => {
    const carol = await createAuthUser(connection.db)
    await connection.db
      .insert(consents)
      .values({ userId: carol, kind: 'terms', version: '2026-10' })
    await connection.db.insert(assessments).values({ ...screening, userId: carol })

    await deleteAuthUsers(connection.db, [carol])

    const [leftConsents, leftResults] = await Promise.all([
      connection.db
        .select()
        .from(consents)
        .where(inArray(consents.userId, [carol])),
      connection.db
        .select()
        .from(assessments)
        .where(inArray(assessments.userId, [carol])),
    ])
    expect(leftConsents).toHaveLength(0)
    expect(leftResults).toHaveLength(0)
  })
})
