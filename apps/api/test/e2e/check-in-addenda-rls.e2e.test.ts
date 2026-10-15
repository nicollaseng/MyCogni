import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq, inArray } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { careLinks, checkInAddenda, checkIns } from '../../src/db/schema/index.ts'
import { registerProfessional } from '../support/care.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

describe('check_in_addenda', () => {
  let connection: DatabaseConnection
  let ana: string
  let bruno: string
  let helena: string
  let shared: string
  let unshared: string
  let brunos: string

  function textsSeenBy(userId: string): Promise<string[]> {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx
        .select({ text: checkInAddenda.text })
        .from(checkInAddenda)
        .orderBy(checkInAddenda.text)
      return rows.map((row) => row.text)
    })
  }

  function write(userId: string, checkInId: string, text: string) {
    return withUser(connection.db, userId, (tx) =>
      tx.insert(checkInAddenda).values({ userId, checkInId, text }).returning(),
    )
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    ana = await createAuthUser(connection.db)
    bruno = await createAuthUser(connection.db)
    helena = await createAuthUser(connection.db)
    await registerProfessional(connection.db, helena)
    await connection.db.insert(careLinks).values({
      professionalId: helena,
      patientId: ana,
      consentVersion: sharingConsentVersion,
      sharesHistory: false,
      startedAt: new Date('2026-10-05T12:00:00Z'),
    })
    const rows = await connection.db
      .insert(checkIns)
      .values([
        { userId: ana, moodLevel: 2, recordedAt: new Date('2026-10-09T12:00:00Z') },
        { userId: ana, moodLevel: 4, recordedAt: new Date('2026-10-01T12:00:00Z') },
        { userId: bruno, moodLevel: 3 },
      ])
      .returning({ id: checkIns.id, userId: checkIns.userId, moodLevel: checkIns.moodLevel })
    shared = rows.find((row) => row.moodLevel === 2)?.id ?? ''
    unshared = rows.find((row) => row.moodLevel === 4)?.id ?? ''
    brunos = rows.find((row) => row.userId === bruno)?.id ?? ''
    await write(ana, shared, 'depois do prazo')
    await write(ana, unshared, 'antes do vínculo')
    await write(bruno, brunos, 'do Bruno')
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [ana, bruno, helena])
    await connection.close()
  })

  it('lets a person read only the additions to their own records', async () => {
    expect(await textsSeenBy(ana)).toEqual(['antes do vínculo', 'depois do prazo'])
    expect(await textsSeenBy(bruno)).toEqual(['do Bruno'])
  })

  it('shows a linked professional the additions exactly when the record is shared', async () => {
    expect(await textsSeenBy(helena)).toEqual(['depois do prazo'])
  })

  it('does not let anyone add to a record of someone else', async () => {
    await expect(write(bruno, shared, 'intruso')).rejects.toMatchObject({
      cause: { code: '42501' },
    })
    await expect(
      withUser(connection.db, bruno, (tx) =>
        tx.insert(checkInAddenda).values({ userId: ana, checkInId: shared, text: 'intruso' }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(write(helena, shared, 'nota da profissional')).rejects.toMatchObject({
      cause: { code: '42501' },
    })
  })

  it('does not let the author rewrite or erase an addition', async () => {
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx.update(checkInAddenda).set({ text: 'outro' }).where(eq(checkInAddenda.userId, ana)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx.delete(checkInAddenda).where(eq(checkInAddenda.userId, ana)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('keeps additions within the size limit even from the database', async () => {
    await expect(
      connection.db
        .insert(checkInAddenda)
        .values({ userId: ana, checkInId: shared, text: 'a'.repeat(1001) }),
    ).rejects.toMatchObject({ cause: { code: '23514' } })
    await expect(
      connection.db.insert(checkInAddenda).values({ userId: ana, checkInId: shared, text: '' }),
    ).rejects.toMatchObject({ cause: { code: '23514' } })
  })

  it('removes the additions when the account is deleted', async () => {
    const carol = await createAuthUser(connection.db)
    const [row] = await connection.db
      .insert(checkIns)
      .values({ userId: carol, moodLevel: 3 })
      .returning({ id: checkIns.id })
    await write(carol, row?.id ?? '', 'da Carol')

    await deleteAuthUsers(connection.db, [carol])

    const left = await connection.db
      .select()
      .from(checkInAddenda)
      .where(inArray(checkInAddenda.userId, [carol]))
    expect(left).toHaveLength(0)
  })
})
