import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq, inArray, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { asAnonymous, withUser } from '../../src/db/rls.ts'
import { zenStepProgress } from '../../src/db/schema/index.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

describe('zen_step_progress', () => {
  let connection: DatabaseConnection
  let alice: string
  let bob: string

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    alice = await createAuthUser(connection.db)
    bob = await createAuthUser(connection.db)
    await connection.db.insert(zenStepProgress).values([
      { userId: alice, trackId: 'sleep-and-rest', stepId: 'breathe' },
      { userId: bob, trackId: 'low-mood', stepId: 'check-in' },
    ])
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [alice, bob])
    await connection.close()
  })

  it('lets a person read only their own progress', async () => {
    const rows = await withUser(connection.db, alice, (tx) => tx.select().from(zenStepProgress))

    expect(rows.map((row) => `${row.trackId}/${row.stepId}`)).toEqual(['sleep-and-rest/breathe'])
  })

  it('does not let a person mark a step for someone else', async () => {
    const attempt = withUser(connection.db, alice, (tx) =>
      tx.insert(zenStepProgress).values({ userId: bob, trackId: 'low-mood', stepId: 'reflect' }),
    )

    await expect(attempt).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let a person undo or rewrite someone else’s progress', async () => {
    const deleted = await withUser(connection.db, alice, (tx) =>
      tx.delete(zenStepProgress).where(eq(zenStepProgress.userId, bob)).returning(),
    )
    const rewrite = withUser(connection.db, bob, (tx) =>
      tx.update(zenStepProgress).set({ stepId: 'reflect' }).where(eq(zenStepProgress.userId, bob)),
    )

    expect(deleted).toHaveLength(0)
    await expect(rewrite).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('lets a person undo their own step', async () => {
    await connection.db
      .insert(zenStepProgress)
      .values({ userId: alice, trackId: 'sleep-and-rest', stepId: 'reflect' })

    const deleted = await withUser(connection.db, alice, (tx) =>
      tx
        .delete(zenStepProgress)
        .where(sql`${zenStepProgress.userId} = ${alice} and ${zenStepProgress.stepId} = 'reflect'`)
        .returning(),
    )

    expect(deleted).toHaveLength(1)
  })

  it('shows nothing to visitors without a session', async () => {
    const attempt = asAnonymous(connection.db, (tx) => tx.select().from(zenStepProgress))

    await expect(attempt).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('removes the progress when the account is deleted', async () => {
    const carol = await createAuthUser(connection.db)
    await connection.db
      .insert(zenStepProgress)
      .values({ userId: carol, trackId: 'low-mood', stepId: 'reflect' })

    await deleteAuthUsers(connection.db, [carol])

    const left = await connection.db
      .select()
      .from(zenStepProgress)
      .where(inArray(zenStepProgress.userId, [carol]))
    expect(left).toHaveLength(0)
  })
})
