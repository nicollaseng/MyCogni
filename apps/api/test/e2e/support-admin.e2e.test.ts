import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { z } from 'zod'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { makeAdmin, registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { mailMatching } from '../support/mailpit.ts'
import { tinyPng, uploadSupportAttachment } from '../support/storage.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier, testConfig } from '../support/test-app.ts'

const ticketSchema = z.object({ id: z.uuid(), number: z.int() })
const createdSchema = z.object({ ticket: ticketSchema })
const linkSchema = z.object({ url: z.url(), expiresAt: z.iso.datetime({ offset: true }) })
const notificationsSchema = z.object({
  items: z.array(
    z.object({
      kind: z.string(),
      supportTicket: z.object({ id: z.uuid(), number: z.int(), status: z.string() }).nullable(),
    }),
  ),
})

const message = 'Não consigo trocar o email da minha conta, aparece um erro.'

describe('/v1/admin/support/tickets', () => {
  let app: App
  let connection: DatabaseConnection
  let admin: TestUser
  let clara: TestUser
  let helena: TestUser
  let withPhoto: { id: string; number: number }
  let plain: { id: string; number: number }
  let fromProfessional: { id: string; number: number }

  async function open(user: TestUser, payload: object = {}) {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/support/tickets',
      headers: bearer(user),
      payload: {
        subject: 'account',
        customSubject: null,
        message,
        role: 'patient',
        locale: 'pt-BR',
        attachment: null,
        ...payload,
      },
    })
    return createdSchema.parse(response.json()).ticket
  }

  function get(user: TestUser, url: string) {
    return app.inject({ method: 'GET', url, headers: bearer(user) })
  }

  function move(user: TestUser, id: string, payload: object) {
    return app.inject({
      method: 'POST',
      url: `/v1/admin/support/tickets/${id}/status`,
      headers: bearer(user),
      payload,
    })
  }

  async function supportNotifications(user: TestUser) {
    const { items } = notificationsSchema.parse((await get(user, '/v1/notifications')).json())
    return items.filter((item) => item.kind === 'support').map((item) => item.supportTicket)
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    admin = await createTestUser()
    clara = await createTestUser({ full_name: 'Clara Nunes' })
    helena = await createTestUser()
    await makeAdmin(connection.db, admin.id)
    await registerProfessional(connection.db, helena.id, { fullName: 'Dra. Helena Prado' })
    const photo = await uploadSupportAttachment(clara)
    withPhoto = await open(clara, {
      attachment: {
        path: photo,
        fileName: 'erro.png',
        contentType: 'image/png',
        sizeBytes: tinyPng.length,
      },
    })
    plain = await open(clara, { subject: 'suggestion', locale: 'en-US' })
    fromProfessional = await open(helena, { role: 'professional', subject: 'professional' })
  })

  afterAll(async () => {
    for (const user of [admin, clara, helena]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('keeps the support inbox away from everyone outside the team', async () => {
    const responses = await Promise.all([
      get(clara, '/v1/admin/support/tickets'),
      get(clara, `/v1/admin/support/tickets/${withPhoto.id}`),
      get(clara, `/v1/admin/support/tickets/${withPhoto.id}/attachment`),
      move(clara, withPhoto.id, { status: 'in_progress' }),
      get(helena, `/v1/admin/support/tickets/${withPhoto.id}/attachment`),
    ])

    expect(responses.map((response) => response.statusCode)).toEqual([403, 403, 403, 403, 403])
  })

  it('lists tickets by status with who opened them', async () => {
    const pending = await get(admin, '/v1/admin/support/tickets?status=pending')
    const closed = await get(admin, '/v1/admin/support/tickets?status=closed')

    expect(pending.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: withPhoto.id,
          number: withPhoto.number,
          status: 'pending',
          role: 'patient',
          locale: 'pt-BR',
          requester: { name: 'Clara Nunes', email: clara.email },
          attachment: { fileName: 'erro.png', contentType: 'image/png', sizeBytes: tinyPng.length },
        }),
        expect.objectContaining({
          id: fromProfessional.id,
          role: 'professional',
          requester: { name: 'Dra. Helena Prado', email: helena.email },
        }),
      ]),
    )
    expect(closed.json()).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: withPhoto.id })]),
    )
  })

  it('opens the attachment for the team through a link that expires in minutes', async () => {
    const response = await get(admin, `/v1/admin/support/tickets/${withPhoto.id}/attachment`)
    const { url, expiresAt } = linkSchema.parse(response.json())
    const file = await fetch(url)
    const minutesLeft = (new Date(expiresAt).getTime() - Date.now()) / 60_000

    expect(file.status).toBe(200)
    expect(Buffer.from(await file.arrayBuffer())).toEqual(tinyPng)
    expect(minutesLeft).toBeGreaterThan(3)
    expect(minutesLeft).toBeLessThanOrEqual(5)
    expect((await get(admin, `/v1/admin/support/tickets/${plain.id}/attachment`)).statusCode).toBe(
      404,
    )
    expect((await get(admin, `/v1/admin/support/tickets/${randomUUID()}`)).statusCode).toBe(404)
  })

  it('takes a ticket, telling the person by email and in the app', async () => {
    const response = await move(admin, withPhoto.id, { status: 'in_progress' })
    const label = `#${String(withPhoto.number)}`
    const mail = await mailMatching(clara.email, `Seu chamado ${label} está em andamento`)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.objectContaining({
        status: 'in_progress',
        takenAt: expect.any(String),
        closedAt: null,
      }),
    )
    expect(mail.Text).toContain('Situação: Em andamento')
    expect(mail.Text).toContain(`/support/${withPhoto.id}`)
    expect(mail.Text).not.toContain(message)
    expect(await supportNotifications(clara)).toEqual([
      { id: withPhoto.id, number: withPhoto.number, status: 'in_progress' },
    ])
  })

  it('closes a ticket with a note the person reads, and keeps it closed', async () => {
    const response = await move(admin, withPhoto.id, {
      status: 'closed',
      note: '  Trocamos o email da sua conta.  ',
    })
    const mail = await mailMatching(
      clara.email,
      `Seu chamado #${String(withPhoto.number)} foi fechado`,
    )
    const reopen = await move(admin, withPhoto.id, { status: 'in_progress' })
    const closeAgain = await move(admin, withPhoto.id, { status: 'closed' })
    const own = await get(clara, `/v1/support/tickets/${withPhoto.id}`)

    expect(response.statusCode).toBe(200)
    expect(mail.Text).toMatch(/Mensagem da equipe:\s+Trocamos o email da sua conta\./)
    expect(reopen.statusCode).toBe(409)
    expect(closeAgain.statusCode).toBe(409)
    expect(own.json()).toEqual(
      expect.objectContaining({
        status: 'closed',
        closingNote: 'Trocamos o email da sua conta.',
        takenAt: expect.any(String),
        closedAt: expect.any(String),
      }),
    )
    expect(await supportNotifications(clara)).toEqual([
      { id: withPhoto.id, number: withPhoto.number, status: 'closed' },
      { id: withPhoto.id, number: withPhoto.number, status: 'in_progress' },
    ])
  })

  it('closes a pending ticket straight away in the language of the person', async () => {
    const response = await move(admin, plain.id, { status: 'closed' })
    const mail = await mailMatching(clara.email, `Your ticket #${String(plain.number)} was closed`)

    expect(response.statusCode).toBe(200)
    expect(mail.Text).toContain('Status: Closed')
    expect(mail.Text).not.toContain('Message from the team')
  })

  it('sends professionals back to the professional area', async () => {
    await move(admin, fromProfessional.id, { status: 'in_progress' })
    const label = `#${String(fromProfessional.number)}`

    const confirmation = await mailMatching(helena.email, `Recebemos seu chamado ${label}`)
    const taken = await mailMatching(helena.email, `Seu chamado ${label} está em andamento`)

    expect(confirmation.Text).toContain(`/pro/support/${fromProfessional.id}`)
    expect(taken.Text).toContain(`/pro/support/${fromProfessional.id}`)
    const inbox = await mailMatching(testConfig.supportEmail, `Chamado ${label}`)
    expect(inbox.Text).toContain('Perfil: Profissional')
  })

  it('refuses unknown statuses and tickets that do not exist', async () => {
    const backToPending = await move(admin, plain.id, { status: 'pending' })
    const missing = await move(admin, randomUUID(), { status: 'closed' })

    expect(backToPending.statusCode).toBe(400)
    expect(missing.statusCode).toBe(404)
  })
})

describe('support ticket rate limit', () => {
  let app: App
  let connection: DatabaseConnection
  let user: TestUser

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      config: { ...testConfig, redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:56379' },
    })
    await app.ready()
    user = await createTestUser()
  })

  afterAll(async () => {
    await deleteTestUser(user.id)
    await app.close()
    await connection.close()
  })

  it('answers 429 after five tickets from the same person in a day', async () => {
    const statuses: number[] = []
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/support/tickets',
        headers: bearer(user),
        payload: {
          subject: 'technical',
          customSubject: null,
          message,
          role: 'patient',
          locale: 'pt-BR',
          attachment: null,
        },
      })
      statuses.push(response.statusCode)
      if (response.statusCode === 429) {
        expect(response.json()).toEqual(expect.objectContaining({ code: 'SUPPORT_TICKET_LIMIT' }))
      }
    }

    expect(statuses).toEqual([201, 201, 201, 201, 201, 429])
  })
})
