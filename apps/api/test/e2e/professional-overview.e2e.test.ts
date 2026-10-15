import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { checkIns } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

interface Summary {
  id: string
  checkInsLastWeek: number
  checkInsLast30Days: number
  moodAverage: number | null
  previousMoodAverage: number | null
  attention: string[]
}

describe('/v1/professional overview and metrics', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let ana: TestUser
  let bruno: TestUser

  function get(path: string, user: TestUser) {
    return app.inject({ method: 'GET', url: path, headers: bearer(user) })
  }

  async function post(path: string, user: TestUser, payload?: object) {
    const response = await app.inject({ method: 'POST', url: path, headers: bearer(user), payload })
    expect(response.statusCode).toBeLessThan(300)
    return response.json<{ id: string; invitation: { code: string } }>()
  }

  async function checkInDaysAgo(user: TestUser, moodLevel: number, daysAgo: number): Promise<void> {
    await connection.db.insert(checkIns).values({
      userId: user.id,
      moodLevel,
      emotions: ['worry'],
      recordedAt: sql`now() - make_interval(days => ${daysAgo})`,
    })
  }

  async function link(patient: TestUser): Promise<void> {
    const { invitation } = await post('/v1/invitations', helena, {
      channel: 'link',
      locale: 'pt-BR',
    })
    const claimed = await post('/v1/invitations/claim', patient, { code: invitation.code })
    await post(`/v1/invitations/${claimed.id}/accept`, patient, {
      sharesHistory: true,
      consentVersion: sharingConsentVersion,
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ full_name: 'Bruno Reis' })
    await registerProfessional(connection.db, helena.id)
    for (const [mood, daysAgo] of [
      [5, 12],
      [5, 10],
      [4, 9],
      [2, 3],
      [2, 1],
      [1, 0],
    ] as const) {
      await checkInDaysAgo(ana, mood, daysAgo)
    }
    await post('/v1/assessments', ana, { instrument: 'phq9', answers: [2, 2, 2, 2, 1, 1, 1, 1, 1] })
    await checkInDaysAgo(bruno, 4, 20)
    await link(ana)
    await link(bruno)
    await post('/v1/invitations', helena, { channel: 'link', locale: 'pt-BR' })
  })

  afterAll(async () => {
    for (const user of [helena, ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('summarises each patient with averages, counts and the reasons for attention', async () => {
    const patients = (await get('/v1/professional/patients', helena)).json<Summary[]>()
    const anaSummary = patients.find((patient) => patient.id === ana.id)
    const brunoSummary = patients.find((patient) => patient.id === bruno.id)

    expect(anaSummary).toEqual(
      expect.objectContaining({
        checkInsLastWeek: 3,
        checkInsLast30Days: 6,
        moodAverage: 1.7,
        previousMoodAverage: 4.7,
        attention: ['risk_item', 'low_mood', 'mood_drop'],
      }),
    )
    expect(brunoSummary).toEqual(
      expect.objectContaining({
        checkInsLastWeek: 0,
        checkInsLast30Days: 1,
        moodAverage: null,
        attention: ['inactive'],
      }),
    )
  })

  it('shows 30 days of activity, the latest check-ins and pending invitations', async () => {
    const response = await get('/v1/professional/overview', helena)
    const overview = response.json<{
      activity: { day: string; checkIns: number; patients: number; moodAverage: number | null }[]
      recent: { patientId: string; name: string | null; moodLevel: number }[]
      invitations: { pending: number; expiringSoon: number }
    }>()

    expect(response.statusCode).toBe(200)
    expect(overview.activity).toHaveLength(30)
    expect(overview.activity.reduce((sum, day) => sum + day.checkIns, 0)).toBe(7)
    expect(overview.activity.at(-1)).toEqual(
      expect.objectContaining({ checkIns: 1, patients: 1, moodAverage: 1 }),
    )
    expect(overview.recent[0]).toEqual(
      expect.objectContaining({ patientId: ana.id, name: 'Ana Lima', moodLevel: 1 }),
    )
    expect(overview.invitations).toEqual({ pending: 1, expiringSoon: 0 })
  })

  it('keeps the overview to verified professionals', async () => {
    expect((await get('/v1/professional/overview', ana)).statusCode).toBe(403)
  })
})
