import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { professionalDocumentBucket } from '@mycogni/domain'
import { z } from 'zod'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { makeAdmin } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { sendRegistrationDocument } from '../support/documents.ts'
import { downloadAs, tinyPdf, uploadAs, uploadProfessionalDocument } from '../support/storage.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const profileSchema = z.object({
  status: z.string(),
  document: z.object({ id: z.uuid(), fileName: z.string() }).nullable(),
})

const linkSchema = z.object({ url: z.url(), expiresAt: z.iso.datetime({ offset: true }) })

describe('/v1/professional/documents', () => {
  let app: App
  let connection: DatabaseConnection
  let admin: TestUser
  let helena: TestUser
  let caio: TestUser
  let ana: TestUser
  let documentId: string
  let documentPath: string

  function submit(user: TestUser, payload: object) {
    return app.inject({
      method: 'POST',
      url: '/v1/professional/documents',
      headers: bearer(user),
      payload,
    })
  }

  function link(user: TestUser, id: string) {
    return app.inject({
      method: 'GET',
      url: `/v1/admin/documents/${id}/link`,
      headers: bearer(user),
    })
  }

  function register(user: TestUser, fullName: string) {
    return app.inject({
      method: 'POST',
      url: '/v1/professional',
      headers: bearer(user),
      payload: { kind: 'psychoanalyst', fullName, registration: null },
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    admin = await createTestUser()
    helena = await createTestUser()
    caio = await createTestUser()
    ana = await createTestUser()
    await makeAdmin(connection.db, admin.id)
    await register(helena, 'Helena Prado')
    await register(caio, 'Caio Mendes')
    documentPath = await uploadProfessionalDocument(helena)
    const sent = await submit(helena, {
      path: documentPath,
      fileName: ' Certificado / Instituto.pdf ',
      contentType: 'application/pdf',
      sizeBytes: tinyPdf.length,
    })
    documentId = profileSchema.parse(sent.json()).document?.id ?? ''
  })

  afterAll(async () => {
    for (const user of [admin, helena, caio, ana]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('keeps the latest document of the professional with a readable name', async () => {
    const profile = await app.inject({
      method: 'GET',
      url: '/v1/professional',
      headers: bearer(helena),
    })

    expect(profile.json()).toEqual(
      expect.objectContaining({
        status: 'pending',
        document: {
          id: documentId,
          fileName: 'Certificado Instituto.pdf',
          contentType: 'application/pdf',
          sizeBytes: tinyPdf.length,
          createdAt: expect.any(String),
        },
      }),
    )
  })

  it('refuses documents outside the folder of the professional or never uploaded', async () => {
    const foreign = await uploadProfessionalDocument(caio)
    const outside = await submit(helena, {
      path: foreign,
      fileName: 'CRP.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
    })
    const missing = await submit(helena, {
      path: `${helena.id}/${randomUUID()}.pdf`,
      fileName: 'CRP.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
    })
    const wrongType = await submit(helena, {
      path: documentPath,
      fileName: 'CRP.docx',
      contentType: 'application/msword',
      sizeBytes: 10,
    })
    const tooLarge = await submit(helena, {
      path: documentPath,
      fileName: 'CRP.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10 * 1024 * 1024 + 1,
    })

    expect(outside.statusCode).toBe(422)
    expect(missing.statusCode).toBe(422)
    expect(wrongType.statusCode).toBe(400)
    expect(tooLarge.statusCode).toBe(400)
  })

  it('keeps the files away from patients and other professionals in storage', async () => {
    const own = await downloadAs(helena, professionalDocumentBucket, documentPath)
    const otherProfessional = await downloadAs(caio, professionalDocumentBucket, documentPath)
    const patient = await downloadAs(ana, professionalDocumentBucket, documentPath)
    const patientUpload = await uploadAs(
      ana,
      professionalDocumentBucket,
      `${ana.id}/${randomUUID()}.pdf`,
      'application/pdf',
      tinyPdf,
    )

    expect(own.status).toBe(200)
    expect(otherProfessional.ok).toBe(false)
    expect(patient.ok).toBe(false)
    expect(patientUpload.ok).toBe(false)
  })

  it('opens the document for the team through a link that expires in minutes', async () => {
    const response = await link(admin, documentId)
    const { url, expiresAt } = linkSchema.parse(response.json())
    const file = await fetch(url)
    const minutesLeft = (new Date(expiresAt).getTime() - Date.now()) / 60_000

    expect(response.statusCode).toBe(200)
    expect(file.status).toBe(200)
    expect(Buffer.from(await file.arrayBuffer())).toEqual(tinyPdf)
    expect(minutesLeft).toBeGreaterThan(3)
    expect(minutesLeft).toBeLessThanOrEqual(5)
  })

  it('does not give the link to anyone outside the team', async () => {
    for (const user of [helena, caio, ana]) {
      expect((await link(user, documentId)).statusCode).toBe(403)
    }
    expect((await link(admin, randomUUID())).statusCode).toBe(404)
  })

  it('sends the request back to review when a new document follows a rejection', async () => {
    await app.inject({
      method: 'POST',
      url: `/v1/admin/professionals/${helena.id}/review`,
      headers: bearer(admin),
      payload: { status: 'rejected', note: 'Documento ilegível.' },
    })
    const resent = await sendRegistrationDocument(app, helena, 'Certificado novo.pdf')

    expect(resent.statusCode).toBe(201)
    expect(resent.json()).toEqual(
      expect.objectContaining({
        status: 'pending',
        document: expect.objectContaining({ fileName: 'Certificado novo.pdf' }),
      }),
    )
  })

  it('takes no more documents once the registration is verified', async () => {
    await app.inject({
      method: 'POST',
      url: `/v1/admin/professionals/${helena.id}/review`,
      headers: bearer(admin),
      payload: { status: 'verified' },
    })
    const response = await sendRegistrationDocument(app, caio)
    const late = await submit(helena, {
      path: documentPath,
      fileName: 'CRP.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
    })

    expect(response.statusCode).toBe(201)
    expect(late.statusCode).toBe(409)
  })

  it('answers 404 to someone who is not a professional', async () => {
    const response = await submit(ana, {
      path: `${ana.id}/${randomUUID()}.pdf`,
      fileName: 'CRP.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
    })

    expect(response.statusCode).toBe(404)
  })
})
