import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { professionalProfiles } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { councilNumber } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  professionalAccount,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/professional', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let rui: TestUser
  let lia: TestUser
  let nina: TestUser
  let otto: TestUser
  const helenaNumber = councilNumber().slice(1)

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
    helena = await createTestUser(professionalAccount)
    rui = await createTestUser(professionalAccount)
    lia = await createTestUser(professionalAccount)
    nina = await createTestUser(professionalAccount)
    otto = await createTestUser(professionalAccount)
  })

  afterAll(async () => {
    await deleteTestUser(helena.id)
    await deleteTestUser(rui.id)
    await deleteTestUser(lia.id)
    await deleteTestUser(nina.id)
    await deleteTestUser(otto.id)
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

  it.each([
    ['a free-text registration', { registration: 'CRP 06/123456' }],
    ['a state outside Brazil', { registration: { uf: 'XX', number: '123456' } }],
    ['a number with letters', { registration: { uf: 'SP', number: '12a456' } }],
    ['a number that is too short', { registration: { uf: 'SP', number: '123' } }],
    ['a number that is too long', { registration: { uf: 'SP', number: '123456789' } }],
    ['an institution registration', { institutionRegistration: 'Sociedade 1' }],
  ])('refuses a psychologist with %s', async (_, payload) => {
    const response = await register(helena, {
      kind: 'psychologist',
      fullName: 'Helena Prado',
      registration: { uf: 'SP', number: helenaNumber },
      ...payload,
    })

    expect(response.statusCode).toBe(400)
  })

  it('refuses a council registration from a psychoanalyst', async () => {
    const response = await register(rui, {
      kind: 'psychoanalyst',
      fullName: 'Rui Andrade',
      registration: { uf: 'SP', number: '123456' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('registers a professional waiting for verification', async () => {
    const response = await register(helena, {
      kind: 'psychologist',
      fullName: '  Helena Prado ',
      registration: { uf: 'SP', number: helenaNumber },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      kind: 'psychologist',
      fullName: 'Helena Prado',
      registration: `CRP 06/${helenaNumber}`,
      status: 'pending',
      reviewNote: null,
      createdAt: expect.any(String),
      verifiedAt: null,
      reviewedAt: null,
      emergencyWhatsapp: null,
      document: null,
    })
  })

  it('registers a psychoanalyst with the optional registration of their institution', async () => {
    const response = await register(rui, {
      kind: 'psychoanalyst',
      fullName: 'Rui Andrade',
      registration: null,
      institutionRegistration: '  Sociedade Psicanalítica 4521 ',
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual(
      expect.objectContaining({ registration: 'Sociedade Psicanalítica 4521' }),
    )
  })

  it('refuses a second registration for the same account', async () => {
    const response = await register(helena, {
      kind: 'psychiatrist',
      fullName: 'Helena Prado',
      registration: { uf: 'SP', number: councilNumber() },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'CONFLICT' }))
  })

  it('keeps one council registration on one account, leading zeros included', async () => {
    const taken = await register(lia, {
      kind: 'psychologist',
      fullName: 'Lia Campos',
      registration: { uf: 'SP', number: `0${helenaNumber}` },
    })

    expect(taken.statusCode).toBe(409)
    expect(taken.json()).toEqual(expect.objectContaining({ code: 'REGISTRATION_TAKEN' }))
  })

  it('treats states served by the same psychology council as one registry', async () => {
    const number = councilNumber()
    const para = await register(nina, {
      kind: 'psychologist',
      fullName: 'Nina Matos',
      registration: { uf: 'PA', number },
    })
    const amapa = await register(otto, {
      kind: 'psychologist',
      fullName: 'Otto Matos',
      registration: { uf: 'AP', number },
    })
    const doctor = await register(otto, {
      kind: 'physician',
      fullName: 'Otto Matos',
      registration: { uf: 'PA', number },
    })

    expect(para.json()).toEqual(expect.objectContaining({ registration: `CRP 10/${number}` }))
    expect(amapa.json()).toEqual(expect.objectContaining({ code: 'REGISTRATION_TAKEN' }))
    expect(doctor.statusCode).toBe(201)
    expect(doctor.json()).toEqual(expect.objectContaining({ registration: `CRM-PA ${number}` }))
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
      registration: `CRP 06/${helenaNumber}`,
      status: 'pending',
      reviewNote: null,
      createdAt: expect.any(String),
      verifiedAt: null,
      reviewedAt: null,
      emergencyWhatsapp: null,
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

  it('locks the name once the registration is verified', async () => {
    await connection.db
      .update(professionalProfiles)
      .set({ status: 'verified', verifiedAt: new Date() })
      .where(eq(professionalProfiles.userId, helena.id))
    const before = await profileOf(helena)

    const response = await rename(helena, { fullName: 'Outra Pessoa' })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'IDENTITY_LOCKED' }))
    expect(await profileOf(helena)).toEqual(before)
  })

  it('frees the registration of a rejected professional for another account', async () => {
    await connection.db
      .update(professionalProfiles)
      .set({ status: 'rejected', verifiedAt: null })
      .where(eq(professionalProfiles.userId, helena.id))

    const response = await register(lia, {
      kind: 'psychologist',
      fullName: 'Lia Campos',
      registration: { uf: 'SP', number: helenaNumber },
    })

    expect(response.statusCode).toBe(201)
  })
})
