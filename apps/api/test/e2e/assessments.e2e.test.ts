import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/assessments', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  function submit(user: TestUser, payload: Record<string, unknown>) {
    return app.inject({ method: 'POST', url: '/v1/assessments', headers: bearer(user), payload })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('refuses requests without a session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/assessments',
      payload: { instrument: 'gad7', answers: [0, 0, 0, 0, 0, 0, 0] },
    })

    expect(response.statusCode).toBe(401)
  })

  it('scores a PHQ-9 on the server', async () => {
    const response = await submit(ana, { instrument: 'phq9', answers: [2, 2, 2, 2, 2, 1, 1, 0, 0] })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      id: expect.any(String),
      instrument: 'phq9',
      totalScore: 12,
      maxScore: 27,
      severity: 'moderate',
      hasRiskFlag: false,
      completedAt: expect.any(String),
    })
  })

  it('flags risk whenever PHQ-9 item 9 is above zero', async () => {
    const response = await submit(ana, { instrument: 'phq9', answers: [0, 0, 0, 0, 0, 0, 0, 0, 1] })

    expect(response.json()).toEqual(
      expect.objectContaining({ totalScore: 1, severity: 'minimal', hasRiskFlag: true }),
    )
  })

  it('ignores any score sent by the client', async () => {
    const response = await submit(ana, {
      instrument: 'gad7',
      answers: [3, 3, 3, 3, 3, 0, 0],
      totalScore: 0,
      severity: 'minimal',
      hasRiskFlag: false,
    })

    expect(response.json()).toEqual(
      expect.objectContaining({
        totalScore: 15,
        maxScore: 21,
        severity: 'severe',
        hasRiskFlag: false,
      }),
    )
  })

  it.each([
    ['too few answers for the form', { instrument: 'phq9', answers: [0, 0, 0, 0, 0, 0, 0] }],
    ['an answer above 3', { instrument: 'gad7', answers: [0, 0, 0, 4, 0, 0, 0] }],
    ['a fractional answer', { instrument: 'gad7', answers: [0, 0, 0, 1.5, 0, 0, 0] }],
    ['an unknown form', { instrument: 'who5', answers: [0, 0, 0, 0, 0] }],
  ])('rejects %s', async (_, payload) => {
    const response = await submit(ana, payload)

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('lists the results with the newest first', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/assessments',
      headers: bearer(ana),
    })
    const results = response.json<{ instrument: string; totalScore: number }[]>()

    expect(response.statusCode).toBe(200)
    expect(
      results.map(({ instrument, totalScore }) => `${instrument} ${String(totalScore)}`),
    ).toEqual(['gad7 15', 'phq9 1', 'phq9 12'])
  })

  it('keeps each person to their own results', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/assessments',
      headers: bearer(bruno),
    })

    expect(response.json()).toEqual([])
  })
})
