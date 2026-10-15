import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { checkIns } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

interface CheckInBody {
  moodLevel: number
  emotions: string[]
  contexts: string[]
  note: string | null
  recordedAt: string
}

describe('/v1/check-ins', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  function record(user: TestUser, payload: Record<string, unknown>) {
    return app.inject({ method: 'POST', url: '/v1/check-ins', headers: bearer(user), payload })
  }

  function list(user: TestUser, query = '') {
    return app.inject({ method: 'GET', url: `/v1/check-ins${query}`, headers: bearer(user) })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
    await connection.db.insert(checkIns).values([
      { userId: ana.id, moodLevel: 2, recordedAt: new Date('2026-10-01T12:00:00Z') },
      { userId: ana.id, moodLevel: 3, recordedAt: new Date('2026-10-05T12:00:00Z') },
      { userId: ana.id, moodLevel: 4, recordedAt: new Date('2026-10-09T12:00:00Z') },
    ])
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('refuses requests without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/check-ins' })

    expect(response.statusCode).toBe(401)
  })

  it('records mood, emotions, context and note', async () => {
    const response = await record(ana, {
      moodLevel: 1,
      emotions: [' ansiedade ', 'solidão', 'ansiedade'],
      contexts: ['trabalho'],
      note: '  Prazo apertado  ',
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      id: expect.any(String),
      moodLevel: 1,
      emotions: ['ansiedade', 'solidão'],
      contexts: ['trabalho'],
      note: 'Prazo apertado',
      recordedAt: expect.any(String),
    })
  })

  it('records only the mood, keeping an empty note as no note', async () => {
    const response = await record(ana, { moodLevel: 5, emotions: [], contexts: [], note: '   ' })

    expect(response.json()).toEqual(
      expect.objectContaining({ moodLevel: 5, emotions: [], contexts: [], note: null }),
    )
  })

  it.each([
    ['a mood above the scale', { moodLevel: 7, emotions: [], contexts: [], note: null }],
    ['a fractional mood', { moodLevel: 2.5, emotions: [], contexts: [], note: null }],
    [
      'too many emotions',
      {
        moodLevel: 3,
        emotions: Array.from({ length: 13 }, (_, i) => `e${String(i)}`),
        contexts: [],
        note: null,
      },
    ],
    [
      'an emotion that is too long',
      { moodLevel: 3, emotions: ['a'.repeat(41)], contexts: [], note: null },
    ],
    [
      'a note that is too long',
      { moodLevel: 3, emotions: [], contexts: [], note: 'a'.repeat(2001) },
    ],
  ])('rejects %s', async (_, payload) => {
    const response = await record(ana, payload)

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('lists the newest first', async () => {
    const levels = (await list(ana)).json<CheckInBody[]>().map((checkIn) => checkIn.moodLevel)

    expect(levels).toEqual([5, 1, 4, 3, 2])
  })

  it('narrows the list to a window and a size', async () => {
    const window = await list(ana, '?since=2026-10-04T00:00:00Z&before=2026-10-10T00:00:00Z')
    const page = await list(ana, '?before=2026-10-09T12:00:00Z&limit=1')

    expect(window.json<CheckInBody[]>().map((checkIn) => checkIn.moodLevel)).toEqual([4, 3])
    expect(page.json<CheckInBody[]>().map((checkIn) => checkIn.moodLevel)).toEqual([3])
  })

  it('rejects a list size above the limit', async () => {
    expect((await list(ana, '?limit=500')).statusCode).toBe(400)
  })

  it('keeps each person to their own records', async () => {
    expect((await list(bruno)).json()).toEqual([])
  })
})
