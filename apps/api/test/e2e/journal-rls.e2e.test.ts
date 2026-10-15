import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import {
  careLinks,
  journalAccessLog,
  journalEntries,
  journalShareEntries,
  journalShares,
} from '../../src/db/schema/index.ts'
import { registerProfessional } from '../support/care.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

describe('journal', () => {
  let connection: DatabaseConnection
  let helena: string
  let caio: string
  let ana: string
  let bruno: string
  let linkId: string
  let caioLinkId: string
  let morning: string
  let night: string

  function titlesSeenBy(userId: string): Promise<(string | null)[]> {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx
        .select({ title: journalEntries.title })
        .from(journalEntries)
        .where(eq(journalEntries.userId, ana))
        .orderBy(journalEntries.title)
      return rows.map((row) => row.title)
    })
  }

  async function write(userId: string, title: string): Promise<string> {
    const [row] = await withUser(connection.db, userId, (tx) =>
      tx.insert(journalEntries).values({ userId, title, plainText: title }).returning(),
    )
    if (row === undefined) {
      throw new Error('Entry was not written')
    }
    return row.id
  }

  function share(values: Partial<typeof journalShares.$inferInsert> = {}) {
    return withUser(connection.db, ana, (tx) =>
      tx
        .insert(journalShares)
        .values({
          patientId: ana,
          professionalId: helena,
          careLinkId: linkId,
          scope: 'all',
          ...values,
        })
        .returning(),
    )
  }

  async function revokeAll(): Promise<void> {
    await connection.db
      .update(journalShares)
      .set({ revokedAt: new Date() })
      .where(eq(journalShares.patientId, ana))
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    helena = await createAuthUser(connection.db)
    caio = await createAuthUser(connection.db)
    ana = await createAuthUser(connection.db)
    bruno = await createAuthUser(connection.db)
    await registerProfessional(connection.db, helena)
    await registerProfessional(connection.db, caio, { fullName: 'Caio Mendes' })
    const links = await connection.db
      .insert(careLinks)
      .values([
        { professionalId: helena, patientId: ana, consentVersion: sharingConsentVersion },
        { professionalId: caio, patientId: ana, consentVersion: sharingConsentVersion },
      ])
      .returning({ id: careLinks.id, professionalId: careLinks.professionalId })
    linkId = links.find((link) => link.professionalId === helena)?.id ?? ''
    caioLinkId = links.find((link) => link.professionalId === caio)?.id ?? ''
    morning = await write(ana, 'manhã')
    night = await write(ana, 'noite')
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [helena, caio, ana, bruno])
    await connection.close()
  })

  it('keeps every page private to its author by default, even from linked professionals', async () => {
    expect(await titlesSeenBy(ana)).toEqual(['manhã', 'noite'])
    expect(await titlesSeenBy(helena)).toEqual([])
    expect(await titlesSeenBy(bruno)).toEqual([])
  })

  it('does not let anyone write in the journal of someone else', async () => {
    await expect(
      withUser(connection.db, bruno, (tx) =>
        tx.insert(journalEntries).values({ userId: ana, title: 'intruso' }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    const changed = await withUser(connection.db, bruno, (tx) =>
      tx
        .update(journalEntries)
        .set({ title: 'x' })
        .where(eq(journalEntries.id, morning))
        .returning(),
    )
    expect(changed).toEqual([])
  })

  it('lets the author edit the content but never move a page to another owner', async () => {
    const edited = await withUser(connection.db, ana, (tx) =>
      tx
        .update(journalEntries)
        .set({ plainText: 'manhã calma' })
        .where(eq(journalEntries.id, morning))
        .returning(),
    )
    expect(edited).toHaveLength(1)
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx.update(journalEntries).set({ userId: bruno }).where(eq(journalEntries.id, morning)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('shows only the chosen pages to the professional of the share', async () => {
    const [created] = await share({ scope: 'entries' })
    await withUser(connection.db, ana, (tx) =>
      tx.insert(journalShareEntries).values({ shareId: created?.id ?? '', entryId: night }),
    )

    expect(await titlesSeenBy(helena)).toEqual(['noite'])
    expect(await titlesSeenBy(caio)).toEqual([])
    await revokeAll()
    expect(await titlesSeenBy(helena)).toEqual([])
  })

  it('opens the whole journal for a time window and closes it at the end', async () => {
    const [open] = await share({ expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) })
    expect(await titlesSeenBy(helena)).toEqual(['manhã', 'noite'])

    await connection.db
      .update(journalShares)
      .set({ expiresAt: sql`now() - interval '1 minute'` })
      .where(eq(journalShares.id, open?.id ?? ''))
    expect(await titlesSeenBy(helena)).toEqual([])
  })

  it('stops sharing as soon as the care link ends', async () => {
    await share()
    expect(await titlesSeenBy(helena)).toEqual(['manhã', 'noite'])

    await connection.db
      .update(careLinks)
      .set({ endedAt: new Date(), endedBy: 'patient' })
      .where(eq(careLinks.id, linkId))
    expect(await titlesSeenBy(helena)).toEqual([])
    await connection.db
      .update(careLinks)
      .set({ endedAt: null, endedBy: null })
      .where(eq(careLinks.id, linkId))
    await revokeAll()
  })

  it('accepts shares only from the patient, through their own active link', async () => {
    await expect(
      withUser(connection.db, helena, (tx) =>
        tx
          .insert(journalShares)
          .values({ patientId: ana, professionalId: helena, careLinkId: linkId, scope: 'all' }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(share({ careLinkId: caioLinkId })).rejects.toMatchObject({
      cause: { code: '42501' },
    })
    await expect(
      withUser(connection.db, bruno, (tx) =>
        tx
          .insert(journalShares)
          .values({ patientId: bruno, professionalId: helena, careLinkId: linkId, scope: 'all' }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let a share point at pages of someone else', async () => {
    const page = await write(bruno, 'do bruno')
    const [created] = await share({ scope: 'entries' })

    await expect(
      withUser(connection.db, ana, (tx) =>
        tx.insert(journalShareEntries).values({ shareId: created?.id ?? '', entryId: page }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await revokeAll()
  })

  it('records each reading by the professional for the patient to see', async () => {
    const [created] = await share()
    const shareId = created?.id ?? ''

    await withUser(connection.db, helena, (tx) =>
      tx.insert(journalAccessLog).values({ shareId, entryId: night, professionalId: helena }),
    )
    const seenByAna = await withUser(connection.db, ana, (tx) => tx.select().from(journalAccessLog))
    const seenByBruno = await withUser(connection.db, bruno, (tx) =>
      tx.select().from(journalAccessLog),
    )

    expect(seenByAna).toEqual([expect.objectContaining({ entryId: night, professionalId: helena })])
    expect(seenByBruno).toEqual([])
    await revokeAll()
    await expect(
      withUser(connection.db, helena, (tx) =>
        tx.insert(journalAccessLog).values({ shareId, entryId: night, professionalId: helena }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('lets only the patient revoke, and only by setting the revocation date', async () => {
    const [created] = await share()
    const byProfessional = await withUser(connection.db, helena, (tx) =>
      tx
        .update(journalShares)
        .set({ revokedAt: new Date() })
        .where(eq(journalShares.id, created?.id ?? ''))
        .returning(),
    )
    expect(byProfessional).toEqual([])
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx
          .update(journalShares)
          .set({ scope: 'entries' })
          .where(eq(journalShares.id, created?.id ?? '')),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    const revoked = await withUser(connection.db, ana, (tx) =>
      tx
        .update(journalShares)
        .set({ revokedAt: new Date() })
        .where(eq(journalShares.id, created?.id ?? ''))
        .returning(),
    )
    expect(revoked).toHaveLength(1)
  })
})
