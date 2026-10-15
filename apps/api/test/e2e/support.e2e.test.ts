import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { supportAttachmentBucket, supportAttachmentLimits } from '@mycogni/domain'
import { z } from 'zod'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { mailMatching } from '../support/mailpit.ts'
import {
  downloadAs,
  tinyPdf,
  tinyPng,
  uploadAs,
  uploadSupportAttachment,
} from '../support/storage.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  testSupabaseUrl,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier, testConfig } from '../support/test-app.ts'

const createdSchema = z.object({
  ticket: z.object({ id: z.uuid(), number: z.int(), status: z.string() }),
  emailSent: z.boolean(),
})

const message = 'O app fecha sozinho quando abro a tela de registros pelo celular.'

describe('/v1/support/tickets', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let anaTicket: { id: string; number: number }

  function open(user: TestUser, payload: object) {
    return app.inject({
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
        ...payload,
      },
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser({ full_name: 'Ana Souza' })
    bruno = await createTestUser({ full_name: 'Bruno Lima' })
    anaTicket = createdSchema.parse((await open(ana, {})).json()).ticket
  })

  afterAll(async () => {
    for (const user of [ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('opens a pending ticket and sends it to the support inbox with the requester to reply to', async () => {
    const label = `#${String(anaTicket.number)}`
    const inbox = await mailMatching(testConfig.supportEmail, `Chamado ${label}`)

    expect(inbox.Subject).toBe(`Chamado ${label} · Problema técnico`)
    expect(inbox.ReplyTo).toEqual([expect.objectContaining({ Address: ana.email })])
    expect(inbox.Text).toContain('Ana Souza')
    expect(inbox.Text).toContain(ana.email)
    expect(inbox.Text).toContain('Perfil: Paciente')
    expect(inbox.Text).toContain('Anexo: Sem anexo')
    expect(inbox.Text).toContain(message)
    expect(inbox.Text).toContain(`/admin/support/${anaTicket.id}`)
  })

  it('confirms the ticket to the person by email without repeating what they wrote', async () => {
    const label = `#${String(anaTicket.number)}`
    const confirmation = await mailMatching(ana.email, `Recebemos seu chamado ${label}`)

    expect(confirmation.Text).toContain('Situação: Pendente')
    expect(confirmation.Text).toContain('Assunto: Problema técnico')
    expect(confirmation.Text).toContain(`http://localhost:3000/support/${anaTicket.id}`)
    expect(confirmation.ReplyTo).toEqual([
      expect.objectContaining({ Address: testConfig.supportEmail }),
    ])
    expect(confirmation.Text).not.toContain(message)
    expect(confirmation.HTML).not.toContain(message)
  })

  it('writes the confirmation in the language of the person', async () => {
    const response = await open(ana, {
      subject: 'other',
      customSubject: 'Exportar dados',
      locale: 'pt-PT',
    })
    const { ticket, emailSent } = createdSchema.parse(response.json())

    expect(emailSent).toBe(true)
    const confirmation = await mailMatching(
      ana.email,
      `Recebemos o seu pedido #${String(ticket.number)}`,
    )
    expect(confirmation.Text).toContain('Estado: Pendente')
    const inbox = await mailMatching(testConfig.supportEmail, `Chamado #${String(ticket.number)}`)
    expect(inbox.Subject).toContain('Outro assunto: Exportar dados')
    expect(inbox.Text).toContain('Idioma: pt-PT')
  })

  it('keeps a photo or a document attached to the ticket with a readable name', async () => {
    const photo = await uploadSupportAttachment(ana)
    const document = await uploadSupportAttachment(ana, {
      extension: 'pdf',
      contentType: 'application/pdf',
      body: tinyPdf,
    })
    const withPhoto = await open(ana, {
      attachment: {
        path: photo,
        fileName: ' tela / erro.png ',
        contentType: 'image/png',
        sizeBytes: tinyPng.length,
      },
    })
    const withDocument = await open(ana, {
      subject: 'privacy',
      attachment: {
        path: document,
        fileName: 'comprovante.pdf',
        contentType: 'application/pdf',
        sizeBytes: tinyPdf.length,
      },
    })

    expect(withPhoto.statusCode).toBe(201)
    expect(withPhoto.json()).toEqual(
      expect.objectContaining({
        ticket: expect.objectContaining({
          status: 'pending',
          attachment: {
            fileName: 'tela erro.png',
            contentType: 'image/png',
            sizeBytes: tinyPng.length,
          },
        }),
      }),
    )
    expect(withDocument.statusCode).toBe(201)
    const { ticket } = createdSchema.parse(withDocument.json())
    const inbox = await mailMatching(testConfig.supportEmail, `Chamado #${String(ticket.number)}`)
    expect(inbox.Text).toContain('Anexo: comprovante.pdf (application/pdf')
  })

  it('refuses attachments of someone else, never uploaded or different from what was stored', async () => {
    const foreign = await uploadSupportAttachment(bruno)
    const own = await uploadSupportAttachment(ana)
    const attachment = { fileName: 'tela.png', contentType: 'image/png', sizeBytes: tinyPng.length }

    const responses = await Promise.all([
      open(ana, { attachment: { ...attachment, path: foreign } }),
      open(ana, { attachment: { ...attachment, path: `${ana.id}/${randomUUID()}.png` } }),
      open(ana, { attachment: { ...attachment, path: own, sizeBytes: 10 } }),
      open(ana, { attachment: { ...attachment, path: own, contentType: 'image/jpeg' } }),
    ])

    expect(responses.map((response) => response.statusCode)).toEqual([422, 422, 422, 422])
  })

  it('limits photos to 5 MB, files to 2 MB and refuses other kinds of files', async () => {
    const path = `${ana.id}/${randomUUID()}.png`
    const responses = await Promise.all([
      open(ana, {
        attachment: {
          path,
          fileName: 'foto.png',
          contentType: 'image/png',
          sizeBytes: supportAttachmentLimits.imageBytes + 1,
        },
      }),
      open(ana, {
        attachment: {
          path,
          fileName: 'doc.pdf',
          contentType: 'application/pdf',
          sizeBytes: supportAttachmentLimits.fileBytes + 1,
        },
      }),
      open(ana, {
        attachment: {
          path,
          fileName: 'app.exe',
          contentType: 'application/x-msdownload',
          sizeBytes: 10,
        },
      }),
    ])

    expect(responses.map((response) => response.statusCode)).toEqual([400, 400, 400])
  })

  it('asks for a written subject only for another subject and for a message long enough', async () => {
    const responses = await Promise.all([
      open(ana, { subject: 'other', customSubject: null }),
      open(ana, { subject: 'billing', customSubject: 'Cobrança' }),
      open(ana, { message: 'Oi' }),
      open(ana, { message: 'x'.repeat(4001) }),
    ])

    expect(responses.map((response) => response.statusCode)).toEqual([400, 400, 400, 400])
  })

  it('takes tickets from the professional area only from professionals', async () => {
    const response = await open(bruno, { role: 'professional' })

    expect(response.statusCode).toBe(403)
  })

  it('shows each person only their own tickets', async () => {
    const own = await app.inject({
      method: 'GET',
      url: `/v1/support/tickets/${anaTicket.id}`,
      headers: bearer(ana),
    })
    const other = await app.inject({
      method: 'GET',
      url: `/v1/support/tickets/${anaTicket.id}`,
      headers: bearer(bruno),
    })
    const list = await app.inject({
      method: 'GET',
      url: '/v1/support/tickets',
      headers: bearer(bruno),
    })

    expect(own.statusCode).toBe(200)
    expect(own.json()).toEqual(
      expect.objectContaining({
        id: anaTicket.id,
        number: anaTicket.number,
        subject: 'technical',
        message,
        role: 'patient',
        status: 'pending',
        takenAt: null,
        closedAt: null,
      }),
    )
    expect(other.statusCode).toBe(404)
    expect(list.json()).toEqual([])
  })

  it('keeps attachments in storage away from others and from deletion once sent', async () => {
    const path = await uploadSupportAttachment(ana)
    await open(ana, {
      attachment: {
        path,
        fileName: 'tela.png',
        contentType: 'image/png',
        sizeBytes: tinyPng.length,
      },
    })
    const removal = await fetch(`${testSupabaseUrl}/storage/v1/object/${supportAttachmentBucket}`, {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY ?? '',
        authorization: `Bearer ${ana.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [path] }),
    })
    const executable = await uploadAs(
      ana,
      supportAttachmentBucket,
      `${ana.id}/${randomUUID()}.exe`,
      'application/x-msdownload',
      tinyPdf,
    )
    const intoOtherFolder = await uploadAs(
      bruno,
      supportAttachmentBucket,
      `${ana.id}/${randomUUID()}.png`,
      'image/png',
      tinyPng,
    )

    expect(await removal.json()).toEqual([])
    expect((await downloadAs(ana, supportAttachmentBucket, path)).status).toBe(200)
    expect((await downloadAs(bruno, supportAttachmentBucket, path)).ok).toBe(false)
    expect(executable.ok).toBe(false)
    expect(intoOtherFolder.ok).toBe(false)
  })
})
