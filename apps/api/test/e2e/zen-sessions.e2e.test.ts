import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { AccountExport, ZenSession, ZenStats } from '@mycogni/contracts'
import { tracks } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { checkIns, zenSessions, zenStepProgress } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { makeAdmin } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  professionalAccount,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const meditation = {
  kind: 'meditation',
  contentId: 'anxiety',
  startedAt: '2026-03-10T15:00:00Z',
  seconds: 300,
  completed: true,
}

describe('/v1/zen/sessions', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let helena: TestUser

  function record(user: TestUser, payload: object) {
    return app.inject({ method: 'POST', url: '/v1/zen/sessions', headers: bearer(user), payload })
  }

  function list(user: TestUser) {
    return app.inject({
      method: 'GET',
      url: '/v1/zen/sessions?since=2026-01-01T00:00:00Z',
      headers: bearer(user),
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
    helena = await createTestUser(professionalAccount)
  })

  afterAll(async () => {
    for (const user of [ana, bruno, helena]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('needs a signed-in patient', async () => {
    const anonymous = await app.inject({
      method: 'POST',
      url: '/v1/zen/sessions',
      payload: meditation,
    })
    const professional = await record(helena, meditation)

    expect(anonymous.statusCode).toBe(401)
    expect(professional.statusCode).toBe(403)
  })

  it('keeps a finished meditation and how the person felt afterwards', async () => {
    const created = await record(ana, { ...meditation, feelingAfter: null })
    expect(created.statusCode).toBe(201)
    const session = created.json<ZenSession>()
    expect(session).toEqual({
      id: expect.any(String),
      kind: 'meditation',
      contentId: 'anxiety',
      startedAt: '2026-03-10T15:00:00.000Z',
      seconds: 300,
      completed: true,
      feelingAfter: null,
    })

    const felt = await app.inject({
      method: 'PATCH',
      url: `/v1/zen/sessions/${session.id}`,
      headers: bearer(ana),
      payload: { feelingAfter: 5 },
    })
    expect(felt.statusCode).toBe(204)
    expect((await list(ana)).json<ZenSession[]>()).toEqual([{ ...session, feelingAfter: 5 }])
  })

  it('drops short tries, unknown content and impossible feelings', async () => {
    const short = await record(ana, { ...meditation, seconds: 59, completed: false })
    const quickRead = await record(ana, {
      kind: 'reading',
      contentId: 'worry-time',
      startedAt: meditation.startedAt,
      seconds: 9,
      completed: true,
    })
    const unknown = await record(ana, { ...meditation, contentId: 'calm' })
    const feeling = await record(ana, { ...meditation, feelingAfter: 7 })
    const stopped = await record(ana, {
      kind: 'sound',
      contentId: 'calm',
      startedAt: meditation.startedAt,
      seconds: 61,
      completed: false,
    })

    expect([short, quickRead, unknown, feeling].map((response) => response.statusCode)).toEqual([
      400, 400, 400, 400,
    ])
    expect(stopped.statusCode).toBe(201)
  })

  it('shows each person only their own sessions', async () => {
    const [own] = (await list(ana)).json<ZenSession[]>()
    const other = await list(bruno)
    const touch = await app.inject({
      method: 'PATCH',
      url: `/v1/zen/sessions/${own?.id ?? ''}`,
      headers: bearer(bruno),
      payload: { feelingAfter: 0 },
    })

    expect(other.json()).toEqual([])
    expect(touch.statusCode).toBe(404)
  })

  it('exports the sessions with the rest of the data and removes them with the account', async () => {
    const exported = await app.inject({ method: 'GET', url: '/v1/me/export', headers: bearer(ana) })
    expect(
      exported
        .json<AccountExport>()
        .zenSessions.map((session) => session.kind)
        .sort(),
    ).toEqual(['meditation', 'sound'])

    const temporary = await createTestUser()
    await record(temporary, meditation)
    await deleteTestUser(temporary.id)
    const left = await connection.db
      .select({ count: sql<number>`count(*)::int` })
      .from(zenSessions)
      .where(eq(zenSessions.userId, temporary.id))
    expect(left[0]?.count).toBe(0)
  })
})

describe('/v1/admin/zen', () => {
  let app: App
  let connection: DatabaseConnection
  let admin: TestUser
  const people: TestUser[] = []

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    admin = await createTestUser()
    await makeAdmin(connection.db, admin.id)
    for (let index = 0; index < 6; index++) {
      people.push(await createTestUser())
    }
    const steps = tracks['performance-anxiety'].steps
    for (const [index, person] of people.entries()) {
      if (index < 5) {
        await connection.db.insert(zenSessions).values({
          userId: person.id,
          kind: 'meditation',
          contentId: 'inner-peace',
          startedAt: new Date('2026-03-10T15:00:00Z'),
          secondsCompleted: 600,
          completed: true,
          feelingAfter: 5,
        })
        await connection.db.insert(checkIns).values({
          userId: person.id,
          moodLevel: 2,
          emotions: [],
          contexts: [],
          recordedAt: new Date('2026-03-10T14:00:00Z'),
        })
        await connection.db.insert(zenStepProgress).values(
          steps.map((step) => ({
            userId: person.id,
            trackId: 'performance-anxiety',
            stepId: step.id,
          })),
        )
      } else {
        await connection.db.insert(zenSessions).values({
          userId: person.id,
          kind: 'reading',
          contentId: 'screening-not-diagnosis',
          startedAt: new Date('2026-03-10T15:00:00Z'),
          secondsCompleted: 120,
          completed: true,
        })
      }
    }
  })

  afterAll(async () => {
    for (const user of [admin, ...people]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('shows the team aggregated numbers only, hiding groups smaller than five people', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/admin/zen',
      headers: bearer(admin),
    })

    expect(response.statusCode).toBe(200)
    const stats = response.json<ZenStats>()
    expect(stats.minimumPeople).toBe(5)
    const peace = stats.items.find(
      (item) => item.kind === 'meditation' && item.contentId === 'inner-peace',
    )
    expect(peace?.people).toBeGreaterThanOrEqual(5)
    expect(peace?.completions).toBeGreaterThanOrEqual(5)
    expect(peace?.medianSeconds).toBeGreaterThan(0)
    expect(peace?.better).toBeGreaterThanOrEqual(5)
    const reading = stats.items.find(
      (item) => item.kind === 'reading' && item.contentId === 'screening-not-diagnosis',
    )
    expect(reading).toMatchObject({
      people: null,
      starts: null,
      completions: null,
      medianSeconds: null,
    })
    const track = stats.items.find(
      (item) => item.kind === 'track' && item.contentId === 'performance-anxiety',
    )
    expect(track?.completions).toBeGreaterThanOrEqual(5)
    expect(JSON.stringify(stats)).not.toContain(people[0]?.id ?? 'missing')
  })

  it('refuses everyone outside the team', async () => {
    const [someone] = people
    const response = await app.inject({
      method: 'GET',
      url: '/v1/admin/zen',
      headers: someone === undefined ? {} : bearer(someone),
    })

    expect(response.statusCode).toBe(403)
  })
})
