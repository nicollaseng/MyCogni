import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { makeAdmin } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/admin/professionals', () => {
  let app: App
  let connection: DatabaseConnection
  let admin: TestUser
  let marta: TestUser
  let rui: TestUser

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    admin = await createTestUser()
    marta = await createTestUser()
    rui = await createTestUser()
    await makeAdmin(connection.db, admin.id)
    await app.inject({
      method: 'POST',
      url: '/v1/professional',
      headers: bearer(marta),
      payload: { kind: 'psychiatrist', fullName: 'Marta Sousa', registration: 'CRM 12345' },
    })
  })

  afterAll(async () => {
    for (const user of [admin, marta, rui]) {
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
    const review = await app.inject({
      method: 'POST',
      url: `/v1/admin/professionals/${marta.id}/review`,
      headers: bearer(marta),
      payload: { status: 'verified' },
    })

    expect(list.statusCode).toBe(403)
    expect(review.statusCode).toBe(403)
  })

  it('lists the professionals waiting with their email and registration', async () => {
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
        }),
      ]),
    )
  })

  it('verifies a professional, who can then invite patients', async () => {
    const review = await app.inject({
      method: 'POST',
      url: `/v1/admin/professionals/${marta.id}/review`,
      headers: bearer(admin),
      payload: { status: 'verified' },
    })
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

    expect(review.statusCode).toBe(204)
    expect(profile.json()).toEqual(
      expect.objectContaining({ status: 'verified', verifiedAt: expect.any(String) }),
    )
    expect(invitation.statusCode).toBe(201)
  })

  it('answers 404 for someone who never registered as a professional', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/admin/professionals/${rui.id}/review`,
      headers: bearer(admin),
      payload: { status: 'rejected' },
    })

    expect(response.statusCode).toBe(404)
  })

  it('does not accept going back to pending', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/admin/professionals/${marta.id}/review`,
      headers: bearer(admin),
      payload: { status: 'pending' },
    })

    expect(response.statusCode).toBe(400)
  })
})
