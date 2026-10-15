import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq, inArray, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { profiles } from '../../src/db/schema/index.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

describe('profiles', () => {
  let connection: DatabaseConnection
  let alice: string
  let bob: string

  async function displayNameOf(id: string): Promise<string | null | undefined> {
    const [row] = await connection.db.select().from(profiles).where(eq(profiles.id, id))
    return row?.displayName
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    alice = await createAuthUser(connection.db, { full_name: 'Alice Souza' })
    bob = await createAuthUser(connection.db, { name: 'Bob' })
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [alice, bob])
    await connection.close()
  })

  it('creates a profile with the name from the sign up metadata', async () => {
    expect(await displayNameOf(alice)).toBe('Alice Souza')
    expect(await displayNameOf(bob)).toBe('Bob')
  })

  it('keeps only a supported language from the sign up metadata', async () => {
    const lisbon = await createAuthUser(connection.db, { name: 'Rita', locale: 'pt-PT' })
    const unknown = await createAuthUser(connection.db, { name: 'Zoe', locale: 'xx-XX' })
    const rows = await connection.db
      .select({ id: profiles.id, locale: profiles.locale })
      .from(profiles)
      .where(inArray(profiles.id, [lisbon, unknown]))
    await deleteAuthUsers(connection.db, [lisbon, unknown])

    expect(Object.fromEntries(rows.map((row) => [row.id, row.locale]))).toEqual({
      [lisbon]: 'pt-PT',
      [unknown]: null,
    })
  })

  it('refuses a language the app does not speak', async () => {
    await expect(
      withUser(connection.db, alice, (tx) =>
        tx.update(profiles).set({ locale: 'fr-FR' }).where(eq(profiles.id, alice)),
      ),
    ).rejects.toThrow()
  })

  it('lets a user read only their own profile', async () => {
    const rows = await withUser(connection.db, alice, (tx) => tx.select().from(profiles))

    expect(rows.map((row) => row.id)).toEqual([alice])
  })

  it('lets a user update their own profile', async () => {
    const rows = await withUser(connection.db, alice, (tx) =>
      tx
        .update(profiles)
        .set({ displayName: 'Alice S.' })
        .where(eq(profiles.id, alice))
        .returning(),
    )

    expect(rows).toHaveLength(1)
    expect(await displayNameOf(alice)).toBe('Alice S.')
  })

  it('ignores updates to the profile of another user', async () => {
    const rows = await withUser(connection.db, alice, (tx) =>
      tx.update(profiles).set({ displayName: 'Hacked' }).where(eq(profiles.id, bob)).returning(),
    )

    expect(rows).toHaveLength(0)
    expect(await displayNameOf(bob)).toBe('Bob')
  })

  it('does not let a user create profiles', async () => {
    const attempt = withUser(connection.db, alice, (tx) =>
      tx.insert(profiles).values({ id: randomUUID(), displayName: 'Ghost' }),
    )

    await expect(attempt).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let a user delete profiles', async () => {
    const rows = await withUser(connection.db, alice, (tx) =>
      tx.delete(profiles).where(eq(profiles.id, alice)).returning(),
    )

    expect(rows).toHaveLength(0)
    expect(await displayNameOf(alice)).toBe('Alice S.')
  })

  it('hides every profile from anonymous requests', async () => {
    const rows = await connection.db.transaction(async (tx) => {
      await tx.execute(sql`set local role anon`)
      return tx
        .select()
        .from(profiles)
        .where(inArray(profiles.id, [alice, bob]))
    })

    expect(rows).toHaveLength(0)
  })

  it('removes the profile when the user account is deleted', async () => {
    const carol = await createAuthUser(connection.db, { full_name: 'Carol' })

    await deleteAuthUsers(connection.db, [carol])

    expect(await displayNameOf(carol)).toBeUndefined()
  })
})
