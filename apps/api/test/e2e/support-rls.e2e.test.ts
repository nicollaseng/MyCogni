import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { supportAttachmentBucket } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { notifications, supportTickets } from '../../src/db/schema/index.ts'
import { makeAdmin, registerProfessional } from '../support/care.ts'
import { createAuthUser, deleteAuthUsers, testDatabaseUrl } from '../support/database.ts'

type NewTicket = Partial<typeof supportTickets.$inferInsert> & { userId: string }

describe('support tickets', () => {
  let connection: DatabaseConnection
  let marta: string
  let rui: string
  let helena: string
  let admin: string
  let martaTicket: string

  async function storedFile(owner: string, size = 2048): Promise<string> {
    const path = `${owner}/${randomUUID()}.png`
    const metadata = JSON.stringify({ mimetype: 'image/png', size })
    await connection.db.execute(
      sql`insert into storage.objects (bucket_id, name, owner_id, metadata) values (${supportAttachmentBucket}, ${path}, ${owner}, ${metadata}::jsonb)`,
    )
    return path
  }

  function open(userId: string, values: NewTicket) {
    return withUser(connection.db, userId, (tx) =>
      tx
        .insert(supportTickets)
        .values({
          requesterRole: 'patient',
          subject: 'technical',
          message: 'O gráfico de humor não carrega.',
          locale: 'pt-BR',
          ...values,
        })
        .returning({ id: supportTickets.id, status: supportTickets.status }),
    )
  }

  function attachment(path: string, size = 2048) {
    return {
      attachmentPath: path,
      attachmentName: 'tela.png',
      attachmentType: 'image/png' as const,
      attachmentSize: size,
    }
  }

  function ticketsSeenBy(userId: string): Promise<string[]> {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx
        .select({ id: supportTickets.id })
        .from(supportTickets)
        .where(eq(supportTickets.id, martaTicket))
      return rows.map((row) => row.id)
    })
  }

  function change(userId: string, status: string) {
    return withUser(connection.db, userId, async (tx) => {
      const rows = await tx.execute<{ outcome: string }>(
        sql`select public.change_support_ticket_status(${martaTicket}, ${status}, 'Resolvido.') as outcome`,
      )
      return Array.from(rows)[0]?.outcome
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    marta = await createAuthUser(connection.db)
    rui = await createAuthUser(connection.db)
    helena = await createAuthUser(connection.db)
    admin = await createAuthUser(connection.db)
    await makeAdmin(connection.db, admin)
    await registerProfessional(connection.db, helena)
    const [ticket] = await open(marta, { userId: marta, ...attachment(await storedFile(marta)) })
    martaTicket = ticket?.id ?? ''
  })

  afterAll(async () => {
    await connection.db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('storage.allow_delete_query', 'true', true)`)
      await tx.execute(
        sql`delete from storage.objects where bucket_id = ${supportAttachmentBucket} and owner_id in (${marta}, ${rui}, ${helena})`,
      )
    })
    await deleteAuthUsers(connection.db, [marta, rui, helena, admin])
    await connection.close()
  })

  it('opens every ticket as pending', async () => {
    expect(martaTicket).not.toBe('')
    for (const status of ['in_progress', 'closed'] as const) {
      await expect(open(marta, { userId: marta, status })).rejects.toMatchObject({
        cause: { code: '42501' },
      })
    }
    await expect(
      open(marta, { userId: marta, takenAt: new Date(), takenBy: admin }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      open(marta, { userId: marta, createdAt: new Date(Date.now() - 86_400_000) }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('takes tickets only in the name of the person, and as a professional only from professionals', async () => {
    await expect(open(marta, { userId: rui })).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      open(marta, { userId: marta, requesterRole: 'professional' }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    expect(await open(helena, { userId: helena, requesterRole: 'professional' })).toEqual([
      { id: expect.any(String), status: 'pending' },
    ])
  })

  it('accepts only attachments stored in the folder of the person, as they were stored', async () => {
    await expect(
      open(marta, { userId: marta, ...attachment(await storedFile(rui)) }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      open(marta, { userId: marta, ...attachment(`${marta}/${randomUUID()}.png`) }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      open(marta, { userId: marta, ...attachment(await storedFile(marta, 6_000_000), 2048) }),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('shows a ticket only to the person who opened it and to the MyCogniAI team', async () => {
    expect(await ticketsSeenBy(marta)).toEqual([martaTicket])
    expect(await ticketsSeenBy(admin)).toEqual([martaTicket])
    expect(await ticketsSeenBy(rui)).toEqual([])
    expect(await ticketsSeenBy(helena)).toEqual([])
  })

  it('does not let anyone change or delete a ticket directly', async () => {
    for (const userId of [marta, admin]) {
      await expect(
        withUser(connection.db, userId, (tx) =>
          tx
            .update(supportTickets)
            .set({ status: 'closed' })
            .where(eq(supportTickets.id, martaTicket)),
        ),
      ).rejects.toMatchObject({ cause: { code: '42501' } })
      await expect(
        withUser(connection.db, userId, (tx) =>
          tx.delete(supportTickets).where(eq(supportTickets.id, martaTicket)),
        ),
      ).rejects.toMatchObject({ cause: { code: '42501' } })
    }
  })

  it('lets only the team move a ticket, following the allowed steps', async () => {
    expect(await change(marta, 'closed')).toBe('forbidden')
    expect(await change(helena, 'in_progress')).toBe('forbidden')
    expect(await change(admin, 'in_progress')).toBe('changed')
    expect(await change(admin, 'in_progress')).toBe('invalid_transition')
    expect(await change(admin, 'closed')).toBe('changed')
    expect(await change(admin, 'pending')).toBe('invalid_transition')

    const [ticket] = await connection.db
      .select({
        status: supportTickets.status,
        takenBy: supportTickets.takenBy,
        closedBy: supportTickets.closedBy,
        note: supportTickets.closingNote,
      })
      .from(supportTickets)
      .where(eq(supportTickets.id, martaTicket))
    const sent = await connection.db
      .select({ kind: notifications.kind, status: notifications.supportStatus })
      .from(notifications)
      .where(eq(notifications.supportTicketId, martaTicket))

    expect(ticket).toEqual({
      status: 'closed',
      takenBy: admin,
      closedBy: admin,
      note: 'Resolvido.',
    })
    expect(sent).toEqual(
      expect.arrayContaining([
        { kind: 'support', status: 'in_progress' },
        { kind: 'support', status: 'closed' },
      ]),
    )
  })
})
