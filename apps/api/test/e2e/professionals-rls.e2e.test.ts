import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { professionalProfiles } from '../../src/db/schema/index.ts'
import { registerProfessional } from '../support/care.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

type ProfessionalChanges = Partial<typeof professionalProfiles.$inferInsert>

describe('professional profiles', () => {
  let connection: DatabaseConnection
  let helena: string
  let caio: string

  function updateAs(userId: string, professionalId: string, changes: ProfessionalChanges) {
    return withUser(connection.db, userId, (tx) =>
      tx
        .update(professionalProfiles)
        .set(changes)
        .where(eq(professionalProfiles.userId, professionalId))
        .returning(),
    )
  }

  async function professionalOf(userId: string) {
    const [row] = await connection.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId))
    return row
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    helena = await createAuthUser(connection.db, { full_name: 'Helena' })
    caio = await createAuthUser(connection.db, { full_name: 'Caio' })
    await registerProfessional(connection.db, helena, { status: 'pending' })
    await registerProfessional(connection.db, caio, { fullName: 'Dr. Caio Reis' })
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [helena, caio])
    await connection.close()
  })

  it('lets a professional rename their own profile', async () => {
    const rows = await updateAs(helena, helena, { fullName: 'Dra. Helena Lima' })

    expect(rows).toHaveLength(1)
    expect(await professionalOf(helena)).toEqual(
      expect.objectContaining({ fullName: 'Dra. Helena Lima' }),
    )
  })

  it('ignores a rename of another professional', async () => {
    const rows = await updateAs(helena, caio, { fullName: 'Hacked' })

    expect(rows).toHaveLength(0)
    expect(await professionalOf(caio)).toEqual(
      expect.objectContaining({ fullName: 'Dr. Caio Reis' }),
    )
  })

  it.each<[string, ProfessionalChanges]>([
    ['profession', { kind: 'psychiatrist' }],
    ['registration', { registration: 'CRM-SP 99999' }],
    ['status', { status: 'verified' }],
    ['verification date', { verifiedAt: new Date() }],
    ['review note', { reviewNote: 'Aprovado' }],
    ['review date', { reviewedAt: new Date() }],
    ['account', { userId: randomUUID() }],
  ])('does not let a professional change their own %s', async (_, changes) => {
    await expect(
      updateAs(helena, helena, { fullName: 'Dra. Helena Lima', ...changes }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    expect(await professionalOf(helena)).toEqual(
      expect.objectContaining({
        userId: helena,
        kind: 'psychologist',
        registration: 'CRP 06/123456',
        status: 'pending',
        verifiedAt: null,
      }),
    )
  })
})
