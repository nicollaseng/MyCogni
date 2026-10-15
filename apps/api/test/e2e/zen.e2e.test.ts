import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { zenStepProgress } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/zen/progress', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  function request(user: TestUser, method: 'GET' | 'PUT' | 'DELETE', url: string) {
    return app.inject({ method, url: `/v1/zen/progress${url}`, headers: bearer(user) })
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
    const response = await app.inject({ method: 'GET', url: '/v1/zen/progress' })

    expect(response.statusCode).toBe(401)
  })

  it('starts with no step done', async () => {
    const response = await request(ana, 'GET', '')

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it('marks a step of a track as done, once, however many times it is sent', async () => {
    const first = await request(ana, 'PUT', '/everyday-anxiety/read-anxiety-basics')
    const again = await request(ana, 'PUT', '/everyday-anxiety/read-anxiety-basics')

    expect(first.statusCode).toBe(200)
    expect(first.json()).toEqual({
      trackId: 'everyday-anxiety',
      stepId: 'read-anxiety-basics',
      completedAt: expect.any(String),
    })
    expect(again.json()).toEqual(first.json())
    await request(ana, 'PUT', '/everyday-anxiety/breathe')

    const progress = await request(ana, 'GET', '')
    expect(progress.json<{ stepId: string }[]>().map((step) => step.stepId)).toEqual([
      'read-anxiety-basics',
      'breathe',
    ])
  })

  it('undoes a step', async () => {
    const response = await request(ana, 'DELETE', '/everyday-anxiety/breathe')

    expect(response.statusCode).toBe(204)
    const progress = await request(ana, 'GET', '')
    expect(progress.json<{ stepId: string }[]>().map((step) => step.stepId)).toEqual([
      'read-anxiety-basics',
    ])
  })

  it.each([
    ['an unknown track', '/bipolar/read'],
    ['a step from another track', '/everyday-anxiety/write-nights'],
    ['an unknown step', '/low-mood/meditate-for-an-hour'],
  ])('rejects %s', async (_, path) => {
    const response = await request(ana, 'PUT', path)

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('keeps each person to their own progress', async () => {
    await request(bruno, 'DELETE', '/everyday-anxiety/read-anxiety-basics')

    expect((await request(bruno, 'GET', '')).json()).toEqual([])
    expect((await request(ana, 'GET', '')).json()).toHaveLength(1)
  })

  it('leaves out steps that are no longer part of a track', async () => {
    await connection.db
      .insert(zenStepProgress)
      .values({ userId: ana.id, trackId: 'low-mood', stepId: 'retired-step' })

    const progress = await request(ana, 'GET', '')

    expect(progress.json<{ stepId: string }[]>().map((step) => step.stepId)).toEqual([
      'read-anxiety-basics',
    ])
  })
})
