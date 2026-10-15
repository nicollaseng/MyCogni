import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/onboarding/complete', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser

  function complete() {
    return app.inject({ method: 'POST', url: '/v1/onboarding/complete', headers: bearer(ana) })
  }

  function post(url: string, payload: Record<string, unknown>) {
    return app.inject({ method: 'POST', url, headers: bearer(ana), payload })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser({ full_name: 'Ana' })
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await app.close()
    await connection.close()
  })

  it('refuses requests without a session', async () => {
    const response = await app.inject({ method: 'POST', url: '/v1/onboarding/complete' })

    expect(response.statusCode).toBe(401)
  })

  it('waits for the required consents', async () => {
    await post('/v1/consents', { kinds: ['terms', 'privacy', 'ai_processing'] })

    const response = await complete()

    expect(response.statusCode).toBe(422)
    expect(response.json()).toEqual({
      code: 'UNPROCESSABLE_ENTITY',
      message: 'Grant the required consents and answer both screenings before finishing onboarding',
    })
  })

  it('waits for both screenings', async () => {
    await post('/v1/consents', { kinds: ['health_data', 'adult'] })
    await post('/v1/assessments', { instrument: 'phq9', answers: [1, 1, 1, 1, 1, 1, 1, 1, 0] })

    expect((await complete()).statusCode).toBe(422)
  })

  it('finishes once everything is in place and keeps the first date', async () => {
    await post('/v1/assessments', { instrument: 'gad7', answers: [1, 1, 1, 1, 1, 1, 1] })

    const first = await complete()
    const again = await complete()
    const profile = await app.inject({ method: 'GET', url: '/v1/me', headers: bearer(ana) })
    const completedAt = first.json<{ onboardingCompletedAt: string | null }>().onboardingCompletedAt

    expect(first.statusCode).toBe(200)
    expect(completedAt).toEqual(expect.any(String))
    expect(again.json()).toEqual(expect.objectContaining({ onboardingCompletedAt: completedAt }))
    expect(profile.json()).toEqual(
      expect.objectContaining({ displayName: 'Ana', onboardingCompletedAt: completedAt }),
    )
  })
})
