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
  let lia: TestUser

  function register(user: TestUser, payload: Record<string, unknown>) {
    return app.inject({ method: 'POST', url: '/v1/professional', headers: bearer(user), payload })
  }

  function rename(user: TestUser, payload: Record<string, unknown>) {
    return app.inject({ method: 'PATCH', url: '/v1/professional', headers: bearer(user), payload })
  }

  async function profileOf(user: TestUser): Promise<unknown> {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/professional',
      headers: bearer(user),
    })
    return response.json()
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    rui = await createTestUser()
    lia = await createTestUser()
  })

  afterAll(async () => {
    await deleteTestUser(helena.id)
    await deleteTestUser(rui.id)
    await deleteTestUser(lia.id)
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
      reviewNote: null,
      createdAt: expect.any(String),
      verifiedAt: null,
      reviewedAt: null,
      document: null,
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

  it('refuses a rename without a session', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/professional',
      payload: { fullName: 'Helena Prado' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('renames only an existing professional profile', async () => {
    const response = await rename(lia, { fullName: 'Lia Campos' })

    expect(response.statusCode).toBe(404)
  })

  it('lets the professional change the name shown to patients', async () => {
    const response = await rename(helena, { fullName: '  Dra. Helena Prado Lima ' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      kind: 'psychologist',
      fullName: 'Dra. Helena Prado Lima',
      registration: 'CRP 06/123456',
      status: 'pending',
      reviewNote: null,
      createdAt: expect.any(String),
      verifiedAt: null,
      reviewedAt: null,
      document: null,
    })
    expect(await profileOf(helena)).toEqual(
      expect.objectContaining({ fullName: 'Dra. Helena Prado Lima' }),
    )
  })

  it.each([
    ['a name that is too short', { fullName: 'Al' }],
    ['a name that is too long', { fullName: 'a'.repeat(121) }],
    ['a missing name', {}],
    ['a different profession', { fullName: 'Helena Prado', kind: 'psychiatrist' }],
    ['a different registration', { fullName: 'Helena Prado', registration: 'CRM-SP 99999' }],
    ['a self verification', { fullName: 'Helena Prado', status: 'verified' }],
    ['a verification date', { fullName: 'Helena Prado', verifiedAt: '2026-01-01T00:00:00.000Z' }],
  ])('rejects a rename with %s and keeps the profile', async (_, payload) => {
    const before = await profileOf(helena)
    const response = await rename(helena, payload)

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
    expect(await profileOf(helena)).toEqual(before)
  })
})
