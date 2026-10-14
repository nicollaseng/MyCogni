import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/me', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ name: 'Bruno' })
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('refuses requests without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me' })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ code: 'UNAUTHORIZED', message: 'Authentication required' })
  })

  it('refuses a session that is not valid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { authorization: 'Bearer forged.token.value' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired session',
    })
  })

  it('returns the profile created when the person signed up', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(ana) })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: ana.id,
      email: ana.email,
      displayName: 'Ana Lima',
      timezone: 'America/Sao_Paulo',
      onboardingCompletedAt: null,
    })
  })

  it('updates the name and the time zone', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(ana),
      payload: { displayName: '  Ana  ', timezone: 'America/Manaus' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(
      expect.objectContaining({ displayName: 'Ana', timezone: 'America/Manaus' }),
    )
  })

  it('rejects a time zone that does not exist', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(ana),
      payload: { timezone: 'Mars/Olympus' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('keeps each person to their own profile', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(bruno) })

    expect(response.json()).toEqual(
      expect.objectContaining({
        id: bruno.id,
        displayName: 'Bruno',
        timezone: 'America/Sao_Paulo',
      }),
    )
  })
})
