import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq, inArray, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import {
  assessments,
  careLinks,
  checkInAddenda,
  checkIns,
  invitations,
  journalEntries,
  professionalProfiles,
  profiles,
} from '../../src/db/schema/index.ts'
import { registerProfessional, seedInvitation } from '../support/care.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

const policyViolation = { cause: { code: '42501' } }

describe('profiles.account_type', () => {
  let connection: DatabaseConnection
  const created: string[] = []

  async function user(metadata: Record<string, string> = {}): Promise<string> {
    const id = await createAuthUser(connection.db, metadata)
    created.push(id)
    return id
  }

  async function typeOf(id: string): Promise<string | undefined> {
    const [row] = await connection.db
      .select({ accountType: profiles.accountType })
      .from(profiles)
      .where(eq(profiles.id, id))
    return row?.accountType
  }

  function adopt(id: string): Promise<boolean> {
    return withUser(connection.db, id, async (tx) => {
      const [row] = await tx.execute<{ adopted: boolean }>(
        sql`select public.adopt_professional_account() as adopted`,
      )
      return row?.adopted === true
    })
  }

  beforeAll(() => {
    connection = connectDatabase(testDatabaseUrl)
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, created)
    await connection.close()
  })

  it('takes the type from the sign up and accepts only the two known values', async () => {
    const ids = [
      await user({ account_type: 'professional' }),
      await user({ account_type: 'patient' }),
      await user({ account_type: 'admin' }),
      await user({ account_type: 'Professional' }),
      await user(),
    ]

    expect(await Promise.all(ids.map(typeOf))).toEqual([
      'professional',
      'patient',
      'patient',
      'patient',
      'patient',
    ])
  })

  it('never lets the person change the type, not even through a direct update', async () => {
    const patient = await user({ account_type: 'patient' })
    const professional = await user({ account_type: 'professional' })

    await expect(
      withUser(connection.db, patient, (tx) =>
        tx.update(profiles).set({ accountType: 'professional' }).where(eq(profiles.id, patient)),
      ),
    ).rejects.toMatchObject(policyViolation)
    await expect(
      withUser(connection.db, professional, (tx) =>
        tx.update(profiles).set({ accountType: 'patient' }).where(eq(profiles.id, professional)),
      ),
    ).rejects.toMatchObject(policyViolation)
    expect([await typeOf(patient), await typeOf(professional)]).toEqual(['patient', 'professional'])
  })

  it('still lets the person edit the rest of the profile', async () => {
    const patient = await user()

    const rows = await withUser(connection.db, patient, (tx) =>
      tx
        .update(profiles)
        .set({ displayName: 'Rita', timezone: 'Europe/Lisbon' })
        .where(eq(profiles.id, patient))
        .returning({ id: profiles.id }),
    )

    expect(rows).toHaveLength(1)
  })

  it('refuses health records written by a professional account', async () => {
    const professional = await user({ account_type: 'professional' })
    const [own] = await connection.db
      .insert(checkIns)
      .values({ userId: professional, moodLevel: 3 })
      .returning({ id: checkIns.id })

    const attempts = [
      () =>
        withUser(connection.db, professional, (tx) =>
          tx.insert(checkIns).values({ userId: professional, moodLevel: 4 }),
        ),
      () =>
        withUser(connection.db, professional, (tx) =>
          tx.insert(checkInAddenda).values({
            checkInId: own?.id ?? '',
            userId: professional,
            text: 'nota',
          }),
        ),
      () =>
        withUser(connection.db, professional, (tx) =>
          tx.insert(assessments).values({
            userId: professional,
            instrument: 'gad7',
            answers: [0, 0, 0, 0, 0, 0, 0],
            totalScore: 0,
            severity: 'minimal',
            hasRiskFlag: false,
          }),
        ),
      () =>
        withUser(connection.db, professional, (tx) =>
          tx.insert(journalEntries).values({ userId: professional, title: 'Diário' }),
        ),
    ]

    for (const attempt of attempts) {
      await expect(attempt()).rejects.toMatchObject(policyViolation)
    }
  })

  it('refuses a care link where a professional account is the patient', async () => {
    const helena = await user({ account_type: 'professional' })
    const caio = await user({ account_type: 'professional' })
    await registerProfessional(connection.db, helena)
    const invitation = await seedInvitation(connection.db, {
      professionalId: helena,
      patientId: caio,
    })
    await connection.db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id))

    const attempt = withUser(connection.db, caio, (tx) =>
      tx.insert(careLinks).values({
        professionalId: helena,
        patientId: caio,
        invitationId: invitation.id,
        consentVersion: sharingConsentVersion,
      }),
    )

    await expect(attempt).rejects.toMatchObject(policyViolation)
  })

  it('refuses a professional registration from a patient account', async () => {
    const patient = await user()

    const attempt = withUser(connection.db, patient, (tx) =>
      tx.insert(professionalProfiles).values({
        userId: patient,
        kind: 'psychologist',
        fullName: 'Ana Lima',
        registrationCouncil: 'crp',
        registrationUf: 'SP',
        registrationNumber: '000001',
      }),
    )

    await expect(attempt).rejects.toMatchObject(policyViolation)
  })

  it('lets a patient account write its own records', async () => {
    const patient = await user()

    const rows = await withUser(connection.db, patient, (tx) =>
      tx.insert(checkIns).values({ userId: patient, moodLevel: 5 }).returning(),
    )

    expect(rows).toHaveLength(1)
  })

  it('turns an untyped account into a professional once, and only while it is brand new', async () => {
    const fresh = await user({ name: 'Conta Google' })

    expect(await adopt(fresh)).toBe(true)
    expect(await typeOf(fresh)).toBe('professional')
    expect(await adopt(fresh)).toBe(false)
    expect(await typeOf(fresh)).toBe('professional')
  })

  it('keeps the type of accounts typed at sign up, used, or older than an hour', async () => {
    const typed = await user({ account_type: 'patient' })
    const used = await user()
    const old = await user()
    await connection.db.insert(checkIns).values({ userId: used, moodLevel: 4 })
    await connection.db
      .update(profiles)
      .set({ createdAt: new Date(Date.now() - 2 * 60 * 60_000) })
      .where(eq(profiles.id, old))

    expect([await adopt(typed), await adopt(used), await adopt(old)]).toEqual([false, false, false])
    const rows = await connection.db
      .select({ accountType: profiles.accountType })
      .from(profiles)
      .where(inArray(profiles.id, [typed, used, old]))
    expect(rows.map((row) => row.accountType)).toEqual(['patient', 'patient', 'patient'])
  })
})
