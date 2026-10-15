import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { profiles } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  professionalAccount,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type Call = readonly [Method, string, object?]

const someone = randomUUID()

const professionalCalls: readonly Call[] = [
  ['GET', '/v1/professional'],
  ['POST', '/v1/professional', { kind: 'psychoanalyst', fullName: 'Ana Lima', registration: null }],
  ['PATCH', '/v1/professional', { fullName: 'Ana Lima' }],
  [
    'POST',
    '/v1/professional/documents',
    { path: 'x/y.pdf', fileName: 'CRP.pdf', contentType: 'application/pdf', sizeBytes: 10 },
  ],
  ['POST', '/v1/invitations', { channel: 'link', locale: 'pt-BR' }],
  ['GET', '/v1/invitations/sent'],
  ['POST', `/v1/invitations/${someone}/resend`, { locale: 'pt-BR' }],
  ['POST', `/v1/invitations/${someone}/cancel`],
  ['GET', '/v1/professional/overview'],
  ['GET', '/v1/professional/patients'],
  ['GET', `/v1/professional/patients/${someone}`],
  ['GET', `/v1/professional/patients/${someone}/check-ins`],
  ['GET', `/v1/professional/patients/${someone}/check-ins/${someone}`],
  ['GET', `/v1/professional/patients/${someone}/assessments`],
  ['GET', `/v1/professional/patients/${someone}/insights`],
  ['GET', `/v1/professional/patients/${someone}/journal`],
  ['GET', `/v1/professional/patients/${someone}/reports/mood`],
  ['GET', `/v1/professional/patients/${someone}/assistant`],
  ['POST', `/v1/professional/patients/${someone}/assistant/messages`, { text: 'Oi' }],
  ['GET', '/v1/professional/alerts'],
  ['GET', '/v1/professional/alerts/count'],
  ['POST', `/v1/professional/alerts/${someone}/acknowledge`],
]

const patientCalls: readonly Call[] = [
  ['POST', '/v1/onboarding/complete'],
  ['POST', '/v1/consents', { kinds: ['health_data'] }],
  ['GET', '/v1/check-ins'],
  ['GET', '/v1/check-ins/count'],
  ['POST', '/v1/check-ins', { moodLevel: 4, emotions: [], contexts: [], note: null }],
  ['GET', `/v1/check-ins/${someone}`],
  ['POST', `/v1/check-ins/${someone}/addenda`, { text: 'nota' }],
  ['GET', '/v1/assessments'],
  ['POST', '/v1/assessments', { instrument: 'gad7', answers: [0, 0, 0, 0, 0, 0, 0] }],
  ['GET', '/v1/journal'],
  ['POST', '/v1/journal'],
  ['GET', '/v1/journal/shares'],
  ['GET', '/v1/insights'],
  ['GET', '/v1/reports/mood'],
  ['POST', '/v1/invitations/claim', { code: 'K7M2X9QA' }],
  ['POST', '/v1/invitations/attach'],
  ['GET', '/v1/invitations/received'],
  ['POST', `/v1/invitations/${someone}/decline`],
  ['GET', '/v1/care-links'],
  ['POST', `/v1/care-links/${someone}/end`],
  ['GET', '/v1/assistant'],
  ['POST', '/v1/assistant/messages', { text: 'Oi' }],
  ['GET', '/v1/zen/progress'],
]

describe('account types', () => {
  let app: App
  let connection: DatabaseConnection
  let patient: TestUser
  let professional: TestUser
  const created: TestUser[] = []

  function call(user: TestUser, [method, url, payload]: Call) {
    return app.inject({ method, url, headers: bearer(user), ...(payload ? { payload } : {}) })
  }

  async function freshUser(metadata: Record<string, string> = {}): Promise<TestUser> {
    const user = await createTestUser(metadata)
    created.push(user)
    return user
  }

  function adopt(user: TestUser, accountType = 'professional') {
    return call(user, ['POST', '/v1/me/account-type', { accountType }])
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    patient = await freshUser({ account_type: 'patient' })
    professional = await freshUser(professionalAccount)
  })

  afterAll(async () => {
    for (const user of created) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('tells each person which kind of account they hold', async () => {
    const [mine, theirs] = await Promise.all([
      call(patient, ['GET', '/v1/me']),
      call(professional, ['GET', '/v1/me']),
    ])

    expect(mine.json()).toEqual(expect.objectContaining({ accountType: 'patient' }))
    expect(theirs.json()).toEqual(expect.objectContaining({ accountType: 'professional' }))
  })

  it.each(professionalCalls)('keeps %s %s away from patient accounts', async (...request) => {
    const response = await call(patient, request)

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual(
      expect.objectContaining({ code: 'PROFESSIONAL_ACCOUNT_REQUIRED' }),
    )
  })

  it.each(patientCalls)('keeps %s %s away from professional accounts', async (...request) => {
    const response = await call(professional, request)

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'PATIENT_ACCOUNT_REQUIRED' }))
  })

  it('lets both kinds of account use the profile, notifications and support', async () => {
    const shared: readonly Call[] = [
      ['GET', '/v1/me'],
      ['GET', '/v1/notifications'],
      ['GET', '/v1/consents'],
      ['GET', '/v1/support/tickets'],
    ]
    const responses = await Promise.all(
      [patient, professional].flatMap((user) => shared.map((request) => call(user, request))),
    )

    expect(responses.map((response) => response.statusCode)).toEqual(Array(8).fill(200))
  })

  it('lets a professional accept the terms of use without health consents', async () => {
    const response = await call(professional, [
      'POST',
      '/v1/consents',
      { kinds: ['terms', 'privacy', 'adult'] },
    ])

    expect(response.statusCode).toBe(201)
  })

  it('ignores an attempt to change the type through the profile', async () => {
    const response = await call(patient, ['PATCH', '/v1/me', { accountType: 'professional' }])

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(expect.objectContaining({ accountType: 'patient' }))
  })

  it('types a brand-new Google account as professional once and never again', async () => {
    const google = await freshUser({ name: 'Conta Google' })

    const first = await adopt(google)
    const second = await adopt(google)

    expect(first.statusCode).toBe(200)
    expect(first.json()).toEqual(expect.objectContaining({ accountType: 'professional' }))
    expect(second.statusCode).toBe(409)
    expect(second.json()).toEqual(expect.objectContaining({ code: 'ACCOUNT_TYPE_LOCKED' }))
    expect((await call(google, ['GET', '/v1/professional'])).statusCode).toBe(404)
  })

  it('keeps the type of an account chosen at sign up, already used or older than an hour', async () => {
    const used = await freshUser()
    const old = await freshUser()
    await call(used, ['POST', '/v1/consents', { kinds: ['terms'] }])
    await connection.db
      .update(profiles)
      .set({ createdAt: new Date(Date.now() - 2 * 60 * 60_000) })
      .where(eq(profiles.id, old.id))

    const responses = await Promise.all([patient, used, old].map((user) => adopt(user)))

    expect(responses.map((response) => response.statusCode)).toEqual([409, 409, 409])
    expect((await call(old, ['GET', '/v1/me'])).json()).toEqual(
      expect.objectContaining({ accountType: 'patient' }),
    )
  })

  it('offers no way to turn an account into a patient', async () => {
    const response = await adopt(professional, 'patient')

    expect(response.statusCode).toBe(400)
  })
})
