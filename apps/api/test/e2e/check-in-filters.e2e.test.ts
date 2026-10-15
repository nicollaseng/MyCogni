import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { checkIns } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

interface CheckInBody {
  note: string | null
}

describe('/v1/check-ins filters', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  async function notes(user: TestUser, query: string): Promise<(string | null)[]> {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/check-ins?${query}`,
      headers: bearer(user),
    })
    expect(response.statusCode).toBe(200)
    return response.json<CheckInBody[]>().map((checkIn) => checkIn.note)
  }

  function count(user: TestUser, query: string) {
    return app.inject({
      method: 'GET',
      url: `/v1/check-ins/count?${query}`,
      headers: bearer(user),
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
    await connection.db.insert(checkIns).values([
      {
        userId: ana.id,
        moodLevel: 1,
        emotions: ['anxiety', 'luto'],
        contexts: ['work'],
        note: 'Reunião com 100% de pressão',
        recordedAt: new Date('2026-10-01T12:00:00Z'),
      },
      {
        userId: ana.id,
        moodLevel: 3,
        emotions: ['tiredness'],
        contexts: ['sleep', 'work'],
        note: 'Dormi mal',
        recordedAt: new Date('2026-10-03T12:00:00Z'),
      },
      {
        userId: ana.id,
        moodLevel: 5,
        emotions: ['joy'],
        contexts: ['exercise', 'mudança'],
        note: null,
        recordedAt: new Date('2026-10-05T12:00:00Z'),
      },
      {
        userId: ana.id,
        moodLevel: 6,
        emotions: ['calm'],
        contexts: ['exercise'],
        note: 'Corrida_leve no parque',
        recordedAt: new Date('2026-10-07T12:00:00Z'),
      },
      {
        userId: bruno.id,
        moodLevel: 2,
        emotions: ['anxiety'],
        contexts: ['work'],
        note: 'Reunião do Bruno',
        recordedAt: new Date('2026-10-02T12:00:00Z'),
      },
    ])
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('finds words in the note, ignoring case', async () => {
    expect(await notes(ana, 'q=REUNIÃO')).toEqual(['Reunião com 100% de pressão'])
  })

  it('treats wildcard characters as plain text', async () => {
    expect(await notes(ana, `q=${encodeURIComponent('%')}`)).toEqual([
      'Reunião com 100% de pressão',
    ])
    expect(await notes(ana, 'q=o_p')).toEqual([])
    expect(await notes(ana, 'q=a_leve')).toEqual(['Corrida_leve no parque'])
  })

  it('finds words the person typed as emotions or contexts', async () => {
    expect(await notes(ana, 'q=lut')).toEqual(['Reunião com 100% de pressão'])
    expect(await notes(ana, 'q=mudan')).toEqual([null])
  })

  it('also counts catalog tags whose translated name matched the search', async () => {
    expect(await notes(ana, 'q=cansa&qTags=tiredness')).toEqual(['Dormi mal'])
    expect(await notes(ana, 'q=dorm&qTags=calm,joy')).toEqual([
      'Corrida_leve no parque',
      null,
      'Dormi mal',
    ])
    expect(await notes(ana, 'qTags=tiredness')).toHaveLength(4)
  })

  it('keeps records that carry every chosen tag, among emotions and contexts', async () => {
    expect(await notes(ana, 'tags=work')).toEqual(['Dormi mal', 'Reunião com 100% de pressão'])
    expect(await notes(ana, 'tags=work,anxiety')).toEqual(['Reunião com 100% de pressão'])
    expect(await notes(ana, 'tags=exercise,%20mudança%20,exercise')).toEqual([null])
    expect(await notes(ana, 'tags=,')).toHaveLength(4)
  })

  it('narrows by mood range and by having a note', async () => {
    expect(await notes(ana, 'minMood=4')).toEqual(['Corrida_leve no parque', null])
    expect(await notes(ana, 'maxMood=2')).toEqual(['Reunião com 100% de pressão'])
    expect(await notes(ana, 'minMood=3&maxMood=3')).toEqual(['Dormi mal'])
    expect(await notes(ana, 'hasNote=true&minMood=3')).toEqual([
      'Corrida_leve no parque',
      'Dormi mal',
    ])
    expect(await notes(ana, 'hasNote=false')).toEqual([null])
  })

  it('combines filters with the window and pages with the cursor', async () => {
    expect(await notes(ana, 'tags=work&since=2026-10-02T00:00:00Z')).toEqual(['Dormi mal'])
    expect(await notes(ana, 'hasNote=true&limit=1')).toEqual(['Corrida_leve no parque'])
    expect(await notes(ana, 'hasNote=true&limit=1&before=2026-10-07T12:00:00Z')).toEqual([
      'Dormi mal',
    ])
  })

  it('counts every record that matches, beyond one page', async () => {
    const all = await count(ana, '')
    const filtered = await count(ana, 'q=reuni&since=2026-09-01T00:00:00Z')
    const none = await count(ana, 'tags=family')

    expect(all.json()).toEqual({ count: 4 })
    expect(filtered.json()).toEqual({ count: 1 })
    expect(none.json()).toEqual({ count: 0 })
  })

  it('keeps search and counts to the person own records', async () => {
    expect(await notes(bruno, 'q=reuni')).toEqual(['Reunião do Bruno'])
    expect((await count(bruno, 'tags=anxiety')).json()).toEqual({ count: 1 })
  })

  it('refuses to count without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/check-ins/count' })

    expect(response.statusCode).toBe(401)
  })

  it.each([
    ['a mood above the scale', 'minMood=7'],
    ['a fractional mood', 'maxMood=2.5'],
    ['a note flag that is not a yes or no', 'hasNote=maybe'],
    ['a search that is too long', `q=${'a'.repeat(101)}`],
    ['too many tags', `tags=${Array.from({ length: 13 }, (_, i) => `t${String(i)}`).join(',')}`],
    ['a tag that is too long', `tags=${'a'.repeat(41)}`],
  ])('rejects %s', async (_, query) => {
    const listed = await app.inject({
      method: 'GET',
      url: `/v1/check-ins?${query}`,
      headers: bearer(ana),
    })
    const counted = await count(ana, query)

    expect(listed.statusCode).toBe(400)
    expect(counted.statusCode).toBe(400)
  })
})
