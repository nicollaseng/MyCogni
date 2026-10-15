import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import {
  assessments,
  careLinks,
  checkIns,
  invitations,
  profiles,
} from '../../src/db/schema/index.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'
import { registerProfessional, seedInvitation } from '../support/care.ts'

describe('care links', () => {
  let connection: DatabaseConnection
  let helena: string
  let caio: string
  let ana: string
  let bruno: string
  let invitationId: string

  function linkAs(userId: string, values: Partial<typeof careLinks.$inferInsert> = {}) {
    return withUser(connection.db, userId, (tx) =>
      tx
        .insert(careLinks)
        .values({
          professionalId: helena,
          patientId: ana,
          invitationId,
          consentVersion: sharingConsentVersion,
          ...values,
        })
        .returning(),
    )
  }

  function notesSeenBy(userId: string): Promise<(string | null)[]> {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx
        .select({ note: checkIns.note })
        .from(checkIns)
        .where(eq(checkIns.userId, ana))
        .orderBy(checkIns.recordedAt)
      return rows.map((row) => row.note)
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    helena = await createAuthUser(connection.db, { full_name: 'Helena' })
    caio = await createAuthUser(connection.db, { full_name: 'Caio' })
    ana = await createAuthUser(connection.db, { full_name: 'Ana Souza' })
    bruno = await createAuthUser(connection.db)
    await registerProfessional(connection.db, helena)
    await registerProfessional(connection.db, caio, { fullName: 'Dr. Caio Reis' })
    invitationId = (await seedInvitation(connection.db, { professionalId: helena, patientId: ana }))
      .id
    await connection.db.insert(checkIns).values([
      {
        userId: ana,
        moodLevel: 2,
        note: 'antes do vínculo',
        recordedAt: sql`now() - interval '3 days'`,
      },
      { userId: bruno, moodLevel: 4, note: 'de outra pessoa' },
    ])
    await connection.db.insert(assessments).values({
      userId: ana,
      instrument: 'gad7',
      answers: [1, 1, 1, 1, 1, 1, 1],
      totalScore: 7,
      severity: 'mild',
      hasRiskFlag: false,
    })
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [helena, caio, ana, bruno])
    await connection.close()
  })

  it('does not link before the invitation is accepted', async () => {
    await expect(linkAs(ana)).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let the professional create the link', async () => {
    await connection.db
      .update(invitations)
      .set({ status: 'accepted', respondedAt: new Date() })
      .where(eq(invitations.id, invitationId))

    await expect(linkAs(helena)).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let the accepted invitation link to another professional', async () => {
    await expect(linkAs(ana, { professionalId: caio })).rejects.toMatchObject({
      cause: { code: '42501' },
    })
  })

  it('shows nothing to the professional before the link', async () => {
    expect(await notesSeenBy(helena)).toEqual([])
  })

  it('links once the patient accepts, sharing only from now on by default', async () => {
    const [link] = await linkAs(ana)
    await connection.db
      .insert(checkIns)
      .values({ userId: ana, moodLevel: 4, note: 'depois do vínculo' })

    expect(link?.sharesHistory).toBe(false)
    expect(await notesSeenBy(helena)).toEqual(['depois do vínculo'])
    expect(await notesSeenBy(caio)).toEqual([])
  })

  it('allows a single active link per professional and patient', async () => {
    await expect(linkAs(ana)).rejects.toMatchObject({ cause: { code: '23505' } })
  })

  it('shows the whole history when the patient chose to share it', async () => {
    await connection.db
      .update(careLinks)
      .set({ sharesHistory: true })
      .where(eq(careLinks.patientId, ana))

    expect(await notesSeenBy(helena)).toEqual(['antes do vínculo', 'depois do vínculo'])
  })

  it('lets the professional read the patient name and screenings, never other people', async () => {
    const [names, results, strangers] = await withUser(connection.db, helena, async (tx) => [
      await tx.select({ name: profiles.displayName }).from(profiles).where(eq(profiles.id, ana)),
      await tx.select({ total: assessments.totalScore }).from(assessments),
      await tx.select().from(checkIns).where(eq(checkIns.userId, bruno)),
    ])

    expect(names).toEqual([{ name: 'Ana Souza' }])
    expect(results).toEqual([{ total: 7 }])
    expect(strangers).toEqual([])
  })

  it('does not let the professional write in the patient records', async () => {
    await expect(
      withUser(connection.db, helena, (tx) =>
        tx.insert(checkIns).values({ userId: ana, moodLevel: 0 }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let anyone turn history sharing on after the fact', async () => {
    await expect(
      withUser(connection.db, helena, (tx) =>
        tx.update(careLinks).set({ sharesHistory: true }).where(eq(careLinks.patientId, ana)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('ends the link at the patient request and closes access right away', async () => {
    const ended = await withUser(connection.db, ana, (tx) =>
      tx
        .update(careLinks)
        .set({ endedAt: new Date(), endedBy: 'patient' })
        .where(eq(careLinks.patientId, ana))
        .returning(),
    )

    expect(ended).toHaveLength(1)
    expect(await notesSeenBy(helena)).toEqual([])
  })
})
