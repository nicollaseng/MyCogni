import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import {
  careLinks,
  invitations,
  professionalProfiles,
  professionalReviews,
  profiles,
} from '../../src/db/schema/index.ts'
import { councilNumber, makeAdmin, registerProfessional, seedInvitation } from '../support/care.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

const policyViolation = { cause: { code: '42501' } }
const uniqueViolation = { cause: { code: '23505' } }
const checkViolation = { cause: { code: '23514' } }

describe('professional verification', () => {
  let connection: DatabaseConnection
  let admin: string
  let helena: string
  let pedro: string
  let ana: string
  const users: string[] = []

  async function user(metadata: Record<string, string> = {}): Promise<string> {
    const id = await createAuthUser(connection.db, metadata)
    users.push(id)
    return id
  }

  function reviewsSeenBy(userId: string): Promise<string[]> {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx
        .select({ professionalId: professionalReviews.professionalId })
        .from(professionalReviews)
        .where(sql`${professionalReviews.professionalId} in (${helena}, ${pedro})`)
      return rows.map((row) => row.professionalId).sort()
    })
  }

  function reviewAs(userId: string, professionalId: string, status: string, note: string | null) {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx.execute<{ reviewed: boolean }>(
        sql`select public.review_professional(${professionalId}, ${status}, ${note}) as reviewed`,
      )
      return Array.from(rows)[0]?.reviewed
    })
  }

  function insertProfessional(
    userId: string,
    values: Partial<typeof professionalProfiles.$inferInsert>,
  ) {
    return connection.db.insert(professionalProfiles).values({
      userId,
      kind: 'psychologist',
      fullName: 'Profissional',
      ...values,
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    admin = await user()
    helena = await user()
    pedro = await user()
    ana = await user({ full_name: 'Ana Souza' })
    await makeAdmin(connection.db, admin)
    await connection.db
      .update(profiles)
      .set({ avatarPath: `${helena}/${randomUUID()}.png` })
      .where(eq(profiles.id, helena))
    await registerProfessional(connection.db, helena, { status: 'pending' })
    await registerProfessional(connection.db, pedro, { status: 'pending' })
    await reviewAs(admin, helena, 'verified', null)
    await reviewAs(admin, pedro, 'rejected', 'Documento ilegível.')
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, users)
    await connection.close()
  })

  describe('review history', () => {
    it('records each decision with the admin who made it', async () => {
      const rows = await connection.db
        .select({ adminId: professionalReviews.adminId, decision: professionalReviews.decision })
        .from(professionalReviews)
        .where(eq(professionalReviews.professionalId, pedro))

      expect(rows).toEqual([{ adminId: admin, decision: 'rejected' }])
    })

    it('lets admins read every decision and each professional only their own', async () => {
      expect(await reviewsSeenBy(admin)).toEqual([helena, pedro].sort())
      expect(await reviewsSeenBy(helena)).toEqual([helena])
      expect(await reviewsSeenBy(pedro)).toEqual([pedro])
      expect(await reviewsSeenBy(ana)).toEqual([])
    })

    it('lets nobody write the history directly', async () => {
      const insert = withUser(connection.db, admin, (tx) =>
        tx.insert(professionalReviews).values({ professionalId: pedro, decision: 'verified' }),
      )
      const update = withUser(connection.db, pedro, (tx) =>
        tx
          .update(professionalReviews)
          .set({ note: null })
          .where(sql`true`),
      )

      await expect(insert).rejects.toMatchObject(policyViolation)
      await expect(update).rejects.toMatchObject(policyViolation)
    })

    it('records nothing when someone outside the team tries to review', async () => {
      expect(await reviewAs(pedro, pedro, 'verified', null)).toBe(false)
      expect(await reviewsSeenBy(pedro)).toEqual([pedro])
    })
  })

  describe('locked identity', () => {
    it('keeps the name of a verified professional while other fields still change', async () => {
      const rename = withUser(connection.db, helena, (tx) =>
        tx
          .update(professionalProfiles)
          .set({ fullName: 'Outra Pessoa' })
          .where(eq(professionalProfiles.userId, helena)),
      )
      await expect(rename).rejects.toMatchObject(policyViolation)

      const whatsapp = await withUser(connection.db, helena, (tx) =>
        tx
          .update(professionalProfiles)
          .set({ emergencyWhatsapp: '+5511987654321' })
          .where(eq(professionalProfiles.userId, helena))
          .returning({ userId: professionalProfiles.userId }),
      )
      expect(whatsapp).toHaveLength(1)
    })

    it('lets a professional who is not verified rename themselves', async () => {
      const rows = await withUser(connection.db, pedro, (tx) =>
        tx
          .update(professionalProfiles)
          .set({ fullName: 'Pedro Lima' })
          .where(eq(professionalProfiles.userId, pedro))
          .returning({ userId: professionalProfiles.userId }),
      )

      expect(rows).toHaveLength(1)
    })

    it('keeps the photo of a verified professional and lets the rest of the profile change', async () => {
      const photo = withUser(connection.db, helena, (tx) =>
        tx.update(profiles).set({ avatarPath: null }).where(eq(profiles.id, helena)),
      )
      await expect(photo).rejects.toMatchObject(policyViolation)

      const timezone = await withUser(connection.db, helena, (tx) =>
        tx
          .update(profiles)
          .set({ timezone: 'America/Recife' })
          .where(eq(profiles.id, helena))
          .returning({ id: profiles.id }),
      )
      const patient = await withUser(connection.db, ana, (tx) =>
        tx
          .update(profiles)
          .set({ avatarPath: `${ana}/${randomUUID()}.png` })
          .where(eq(profiles.id, ana))
          .returning({ id: profiles.id }),
      )
      expect(timezone).toHaveLength(1)
      expect(patient).toHaveLength(1)
    })
  })

  describe('care links', () => {
    it('refuses a link to a professional who is not verified, even with an accepted invitation', async () => {
      const invitation = await seedInvitation(connection.db, {
        professionalId: pedro,
        patientId: ana,
      })
      await connection.db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id))

      const attempt = withUser(connection.db, ana, (tx) =>
        tx.insert(careLinks).values({
          professionalId: pedro,
          patientId: ana,
          invitationId: invitation.id,
          consentVersion: sharingConsentVersion,
        }),
      )

      await expect(attempt).rejects.toMatchObject(policyViolation)
    })

    it('still links a patient to a verified professional', async () => {
      const invitation = await seedInvitation(connection.db, {
        professionalId: helena,
        patientId: ana,
      })
      await connection.db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id))

      const rows = await withUser(connection.db, ana, (tx) =>
        tx
          .insert(careLinks)
          .values({
            professionalId: helena,
            patientId: ana,
            invitationId: invitation.id,
            consentVersion: sharingConsentVersion,
          })
          .returning({ id: careLinks.id }),
      )

      expect(rows).toHaveLength(1)
    })
  })

  describe('registrations', () => {
    it('keeps one registration per council region and number, ignoring leading zeros', async () => {
      const number = councilNumber().slice(1)
      await insertProfessional(await user(), {
        registrationCouncil: 'crp',
        registrationUf: 'AM',
        registrationNumber: number,
      })

      await expect(
        insertProfessional(await user(), {
          registrationCouncil: 'crp',
          registrationUf: 'RR',
          registrationNumber: `0${number}`,
        }),
      ).rejects.toMatchObject(uniqueViolation)
      await expect(
        insertProfessional(await user(), {
          registrationCouncil: 'crp',
          registrationUf: 'RR',
          registrationNumber: number,
          status: 'rejected',
        }),
      ).resolves.toBeDefined()
      await expect(
        insertProfessional(await user(), {
          kind: 'physician',
          registrationCouncil: 'crm',
          registrationUf: 'AM',
          registrationNumber: number,
        }),
      ).resolves.toBeDefined()
    })

    it.each<[string, Partial<typeof professionalProfiles.$inferInsert>]>([
      [
        'a council that does not match the profession',
        {
          kind: 'physician',
          registrationCouncil: 'crp',
          registrationUf: 'SP',
          registrationNumber: '1234',
        },
      ],
      [
        'a council for a psychoanalyst',
        {
          kind: 'psychoanalyst',
          registrationCouncil: 'crm',
          registrationUf: 'SP',
          registrationNumber: '1234',
        },
      ],
      ['a council without a state', { registrationCouncil: 'crp', registrationNumber: '1234' }],
      [
        'a state outside Brazil',
        { registrationCouncil: 'crp', registrationUf: 'XX', registrationNumber: '1234' },
      ],
      [
        'a number with letters',
        { registrationCouncil: 'crp', registrationUf: 'SP', registrationNumber: '12a4' },
      ],
    ])('refuses %s', async (_, values) => {
      await expect(insertProfessional(await user(), values)).rejects.toMatchObject(checkViolation)
    })
  })
})
