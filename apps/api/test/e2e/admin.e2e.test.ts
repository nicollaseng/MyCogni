import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { makeAdmin } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { sendRegistrationDocument } from '../support/documents.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/admin/professionals', () => {
  let app: App
  let connection: DatabaseConnection
  let admin: TestUser
  let marta: TestUser
  let rui: TestUser
  let lia: TestUser

  function register(user: TestUser, fullName: string) {
    return app.inject({
      method: 'POST',
      url: '/v1/professional',
      headers: bearer(user),
      payload: { kind: 'psychiatrist', fullName, registration: 'CRM 12345' },
    })
  }

  function review(user: TestUser, professional: TestUser, payload: object) {
    return app.inject({
      method: 'POST',
      url: `/v1/admin/professionals/${professional.id}/review`,
      headers: bearer(user),
      payload,
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    admin = await createTestUser()
    marta = await createTestUser()
    rui = await createTestUser()
    lia = await createTestUser()
    await makeAdmin(connection.db, admin.id)
    await register(marta, 'Marta Sousa')
    await register(lia, 'Lia Campos')
    await sendRegistrationDocument(app, marta, 'Carteira CRM.pdf')
  })

  afterAll(async () => {
    for (const user of [admin, marta, rui, lia]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('keeps the review away from everyone outside the team', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/v1/admin/professionals',
      headers: bearer(rui),
    })
    const verified = await review(marta, marta, { status: 'verified' })

    expect(list.statusCode).toBe(403)
    expect(verified.statusCode).toBe(403)
  })

  it('lists the professionals waiting with their email, registration and document', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/admin/professionals?status=pending',
      headers: bearer(admin),
    })

    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: marta.id,
          fullName: 'Marta Sousa',
          registration: 'CRM 12345',
          email: marta.email,
          status: 'pending',
          verifiedAt: null,
          document: expect.objectContaining({
            fileName: 'Carteira CRM.pdf',
            contentType: 'application/pdf',
          }),
        }),
        expect.objectContaining({ userId: lia.id, document: null }),
      ]),
    )
  })

  it('does not verify someone who has not sent a registration document', async () => {
    const response = await review(admin, lia, { status: 'verified' })
    const list = await app.inject({
      method: 'GET',
      url: '/v1/admin/professionals?status=pending',
      headers: bearer(admin),
    })

    expect(response.statusCode).toBe(409)
    expect(list.json()).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: lia.id, status: 'pending' })]),
    )
  })

  it('verifies a professional, who can then invite patients', async () => {
    const verified = await review(admin, marta, { status: 'verified' })
    const profile = await app.inject({
      method: 'GET',
      url: '/v1/professional',
      headers: bearer(marta),
    })
    const invitation = await app.inject({
      method: 'POST',
      url: '/v1/invitations',
      headers: bearer(marta),
      payload: { channel: 'link', locale: 'pt-PT' },
    })

    expect(verified.statusCode).toBe(204)
    expect(profile.json()).toEqual(
      expect.objectContaining({
        status: 'verified',
        verifiedAt: expect.any(String),
        reviewedAt: expect.any(String),
      }),
    )
    expect(invitation.statusCode).toBe(201)
  })

  it('rejects only with a note, which the professional then reads', async () => {
    const silent = await review(admin, lia, { status: 'rejected' })
    const rejected = await review(admin, lia, {
      status: 'rejected',
      note: '  Envie a carteira do conselho.  ',
    })
    const profile = await app.inject({
      method: 'GET',
      url: '/v1/professional',
      headers: bearer(lia),
    })
    const list = await app.inject({
      method: 'GET',
      url: '/v1/admin/professionals?status=rejected',
      headers: bearer(admin),
    })

    expect(silent.statusCode).toBe(400)
    expect(rejected.statusCode).toBe(204)
    expect(profile.json()).toEqual(
      expect.objectContaining({ status: 'rejected', reviewNote: 'Envie a carteira do conselho.' }),
    )
    expect(list.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: lia.id, reviewNote: 'Envie a carteira do conselho.' }),
      ]),
    )
  })

  it('answers 404 for someone who never registered as a professional', async () => {
    const response = await review(admin, rui, { status: 'rejected', note: 'Sem cadastro.' })

    expect(response.statusCode).toBe(404)
  })

  it('does not accept going back to pending', async () => {
    const response = await review(admin, marta, { status: 'pending' })

    expect(response.statusCode).toBe(400)
  })
})
