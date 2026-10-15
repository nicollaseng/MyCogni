import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/professional', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let rui: TestUser

  function register(user: TestUser, payload: Record<string, unknown>) {
    return app.inject({ method: 'POST', url: '/v1/professional', headers: bearer(user), payload })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    rui = await createTestUser()
  })

  afterAll(async () => {
    await deleteTestUser(helena.id)
    await deleteTestUser(rui.id)
    await app.close()
    await connection.close()
  })

  it('refuses requests without a session', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/professional' })).statusCode).toBe(401)
  })

  it('has no professional profile until one is registered', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/professional',
      headers: bearer(helena),
    })

    expect(response.statusCode).toBe(404)
  })

  it('asks psychologists and doctors for their council registration', async () => {
    const response = await register(helena, {
      kind: 'psychologist',
      fullName: 'Helena Prado',
      registration: null,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('registers a professional waiting for verification', async () => {
    const response = await register(helena, {
      kind: 'psychologist',
      fullName: '  Helena Prado ',
      registration: 'CRP 06/123456',
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      kind: 'psychologist',
      fullName: 'Helena Prado',
      registration: 'CRP 06/123456',
      status: 'pending',
      createdAt: expect.any(String),
      verifiedAt: null,
    })
  })

  it('registers a psychoanalyst without a council registration', async () => {
    const response = await register(rui, {
      kind: 'psychoanalyst',
      fullName: 'Rui Andrade',
      registration: null,
    })

    expect(response.statusCode).toBe(201)
  })

  it('refuses a second registration for the same account', async () => {
    const response = await register(helena, {
      kind: 'psychiatrist',
      fullName: 'Helena Prado',
      registration: 'CRM-SP 99999',
    })

    expect(response.statusCode).toBe(409)
  })

  it('returns the professional profile', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/professional',
      headers: bearer(helena),
    })

    expect(response.json()).toEqual(
      expect.objectContaining({ fullName: 'Helena Prado', status: 'pending' }),
    )
  })
})
