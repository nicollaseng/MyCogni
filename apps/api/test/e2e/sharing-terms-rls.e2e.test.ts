import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { asAnonymous, withUser } from '../../src/db/rls.ts'
import { careLinks, invitations } from '../../src/db/schema/index.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'
import { registerProfessional, seedInvitation } from '../support/care.ts'

const previousVersion = '2026-10'

describe('confirming sharing terms in the database', () => {
  let connection: DatabaseConnection
  let helena: string
  let ana: string
  let bruno: string
  let active: string
  let ended: string

  async function linkOf(patientId: string, endedAt: Date | null = null): Promise<string> {
    const { id: invitationId } = await seedInvitation(connection.db, {
      professionalId: helena,
      patientId,
    })
    await connection.db
      .update(invitations)
      .set({ status: 'accepted', respondedAt: new Date() })
      .where(eq(invitations.id, invitationId))
    const [link] = await connection.db
      .insert(careLinks)
      .values({
        professionalId: helena,
        patientId,
        invitationId,
        consentVersion: previousVersion,
        endedAt,
        endedBy: endedAt === null ? null : 'patient',
      })
      .returning({ id: careLinks.id })
    return link?.id ?? ''
  }

  function confirmAs(userId: string, linkId: string, version: string): Promise<boolean> {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx.execute<{ confirmed: boolean }>(
        sql`select public.confirm_sharing_terms(${linkId}, ${version}) as confirmed`,
      )
      return Array.from(rows)[0]?.confirmed ?? false
    })
  }

  async function stored(id: string) {
    const [row] = await connection.db.select().from(careLinks).where(eq(careLinks.id, id))
    return row
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    helena = await createAuthUser(connection.db, { full_name: 'Helena' })
    ana = await createAuthUser(connection.db, { full_name: 'Ana Souza' })
    bruno = await createAuthUser(connection.db, { full_name: 'Bruno' })
    await registerProfessional(connection.db, helena)
    ended = await linkOf(ana, new Date())
    active = await linkOf(ana)
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [helena, ana, bruno])
    await connection.close()
  })

  it('starts the acceptance time of a new link with the link itself', async () => {
    const link = await stored(active)

    expect(link?.consentAcceptedAt).toEqual(link?.startedAt)
  })

  it('does not let anyone rewrite the terms version with a plain update', async () => {
    for (const userId of [ana, helena]) {
      await expect(
        withUser(connection.db, userId, (tx) =>
          tx
            .update(careLinks)
            .set({ consentVersion: sharingConsentVersion })
            .where(eq(careLinks.id, active)),
        ),
      ).rejects.toMatchObject({ cause: { code: '42501' } })
    }
  })

  it('is not available without a session', async () => {
    await expect(
      asAnonymous(connection.db, (tx) =>
        tx.execute(
          sql`select public.confirm_sharing_terms(${active}, ${sharingConsentVersion}) as confirmed`,
        ),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('confirms nothing for the professional, another person, an ended link or a blank version', async () => {
    expect(await confirmAs(helena, active, sharingConsentVersion)).toBe(false)
    expect(await confirmAs(bruno, active, sharingConsentVersion)).toBe(false)
    expect(await confirmAs(ana, ended, sharingConsentVersion)).toBe(false)
    expect(await confirmAs(ana, active, '')).toBe(false)
    expect((await stored(active))?.consentVersion).toBe(previousVersion)
    expect((await stored(ended))?.consentVersion).toBe(previousVersion)
  })

  it('changes only the version and the acceptance time of the patient active link', async () => {
    const before = await stored(active)
    const untouched = await stored(ended)

    expect(await confirmAs(ana, active, sharingConsentVersion)).toBe(true)

    expect(await stored(active)).toEqual({
      ...before,
      consentVersion: sharingConsentVersion,
      consentAcceptedAt: expect.any(Date),
    })
    expect(await stored(ended)).toEqual(untouched)
  })
})
