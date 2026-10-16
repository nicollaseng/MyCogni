import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { invitations, notifications, professionalProfiles } from '../../src/db/schema/index.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'
import {
  confirmEmail,
  invitationCode,
  registerProfessional,
  seedInvitation,
} from '../support/care.ts'

interface Preview extends Record<string, unknown> {
  professional_name: string
  professional_kind: string
  status: string
}

describe('invitations', () => {
  let connection: DatabaseConnection
  let helena: string
  let pending: string
  let ana: string
  let bruno: string
  let anaEmail: string

  async function claim(userId: string, code: string): Promise<string | null> {
    const rows = await withUser(connection.db, userId, (tx) =>
      tx.execute<{ id: string | null }>(sql`select public.claim_invitation(${code}) as id`),
    )
    return rows[0]?.id ?? null
  }

  async function preview(code: string): Promise<Preview[]> {
    return connection.db.transaction(async (tx) => {
      await tx.execute(sql`set local role anon`)
      return Array.from(
        await tx.execute<Preview>(sql`select * from public.invitation_preview(${code})`),
      )
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    helena = await createAuthUser(connection.db)
    pending = await createAuthUser(connection.db)
    ana = await createAuthUser(connection.db)
    bruno = await createAuthUser(connection.db)
    await registerProfessional(connection.db, helena)
    await registerProfessional(connection.db, pending, {
      fullName: 'Pedro Lima',
      status: 'pending',
    })
    anaEmail = await confirmEmail(connection.db, ana)
  })

  afterAll(async () => {
    await deleteAuthUsers(connection.db, [helena, pending, ana, bruno])
    await connection.close()
  })

  it('lets only verified professionals invite', async () => {
    const verified = await withUser(connection.db, helena, (tx) =>
      seedInvitation(tx, { professionalId: helena }),
    )

    expect(verified.code).toHaveLength(8)
    await expect(
      withUser(connection.db, pending, (tx) => seedInvitation(tx, { professionalId: pending })),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('does not let a professional pick the patient or invite for someone else', async () => {
    await expect(
      withUser(connection.db, helena, (tx) =>
        seedInvitation(tx, { professionalId: helena, patientId: ana }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      withUser(connection.db, pending, (tx) => seedInvitation(tx, { professionalId: helena })),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('refuses an invitation that lasts more than 72 hours', async () => {
    const attempt = connection.db.insert(invitations).values({
      code: invitationCode(),
      professionalId: helena,
      channel: 'link',
      expiresAt: sql`now() + interval '73 hours'`,
    })

    await expect(attempt).rejects.toMatchObject({ cause: { code: '23514' } })
  })

  it('shows anyone holding the code who is inviting, and nothing else', async () => {
    const { code } = await seedInvitation(connection.db, { professionalId: helena })
    const { code: expiredCode } = await seedInvitation(connection.db, {
      professionalId: helena,
      expired: true,
    })

    expect(await preview(code.toLowerCase())).toEqual([
      expect.objectContaining({
        professional_name: 'Dra. Helena Prado',
        professional_kind: 'psychologist',
        status: 'pending',
      }),
    ])
    expect((await preview(expiredCode))[0]?.status).toBe('expired')
    expect(await preview('ZZZZZZZZ')).toEqual([])
  })

  it('attaches the invitation to the person who opens the link and notifies them', async () => {
    const { id, code } = await seedInvitation(connection.db, { professionalId: helena })

    expect(await claim(ana, code)).toBe(id)
    expect(await claim(bruno, code)).toBeNull()
    expect(await claim(ana, code)).toBe(id)

    const bell = await withUser(connection.db, ana, (tx) =>
      tx.select().from(notifications).where(eq(notifications.invitationId, id)),
    )
    expect(bell).toEqual([
      expect.objectContaining({ kind: 'invitation', invitationId: id, readAt: null }),
    ])
  })

  it('does not let a professional claim their own invitation or an expired one', async () => {
    const own = await seedInvitation(connection.db, { professionalId: helena })
    const expired = await seedInvitation(connection.db, { professionalId: helena, expired: true })

    expect(await claim(helena, own.code)).toBeNull()
    expect(await claim(bruno, expired.code)).toBeNull()
  })

  it('finds invitations sent to a confirmed email of an existing account', async () => {
    const sent = await seedInvitation(connection.db, {
      professionalId: helena,
      recipientEmail: anaEmail.toUpperCase(),
    })

    const attached = await withUser(connection.db, ana, (tx) =>
      tx.execute<{ count: number }>(sql`select public.attach_invitations_by_email() as count`),
    )
    const unconfirmed = await withUser(connection.db, bruno, (tx) =>
      tx.execute<{ count: number }>(sql`select public.attach_invitations_by_email() as count`),
    )
    const [row] = await connection.db.select().from(invitations).where(eq(invitations.id, sent.id))

    expect(attached[0]?.count).toBe(1)
    expect(unconfirmed[0]?.count).toBe(0)
    expect(row?.patientId).toBe(ana)
  })

  it('lets the invited person see who invited them, and nobody else', async () => {
    const names = { fullName: professionalProfiles.fullName }
    const asAna = await withUser(connection.db, ana, (tx) =>
      tx.select(names).from(professionalProfiles),
    )
    const asBruno = await withUser(connection.db, bruno, (tx) =>
      tx.select(names).from(professionalProfiles),
    )

    expect(asAna.map((row) => row.fullName)).toEqual(['Dra. Helena Prado'])
    expect(asBruno).toEqual([])
  })

  it('lets the invited person accept or decline, only while pending and in time', async () => {
    const { id, code } = await seedInvitation(connection.db, { professionalId: helena })
    await claim(ana, code)

    const declined = await withUser(connection.db, ana, (tx) =>
      tx
        .update(invitations)
        .set({ status: 'declined', respondedAt: new Date() })
        .where(eq(invitations.id, id))
        .returning(),
    )
    const again = await withUser(connection.db, ana, (tx) =>
      tx.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, id)).returning(),
    )

    expect(declined).toHaveLength(1)
    expect(again).toHaveLength(0)
  })

  it('does not let the invited person cancel, stretch or hand over an invitation', async () => {
    const { id, code } = await seedInvitation(connection.db, { professionalId: helena })
    await claim(ana, code)

    await expect(
      withUser(connection.db, ana, (tx) =>
        tx.update(invitations).set({ status: 'canceled' }).where(eq(invitations.id, id)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx
          .update(invitations)
          .set({ expiresAt: sql`now() + interval '1 year'` })
          .where(eq(invitations.id, id)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx.update(invitations).set({ patientId: bruno }).where(eq(invitations.id, id)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('lets the professional cancel a pending invitation but never answer it', async () => {
    const { id } = await seedInvitation(connection.db, { professionalId: helena })

    await expect(
      withUser(connection.db, helena, (tx) =>
        tx.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, id)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    const canceled = await withUser(connection.db, helena, (tx) =>
      tx.update(invitations).set({ status: 'canceled' }).where(eq(invitations.id, id)).returning(),
    )

    expect(canceled).toHaveLength(1)
  })

  it('keeps notifications private and only lets their owner mark them as read', async () => {
    const [own] = await withUser(connection.db, ana, (tx) =>
      tx
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.userId, ana))
        .returning(),
    )
    const others = await withUser(connection.db, bruno, (tx) =>
      tx.select().from(notifications).where(eq(notifications.userId, ana)),
    )

    expect(own?.readAt).not.toBeNull()
    expect(others).toEqual([])
    await expect(
      withUser(connection.db, ana, (tx) =>
        tx.update(notifications).set({ kind: 'marketing' }).where(eq(notifications.userId, ana)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })
})
