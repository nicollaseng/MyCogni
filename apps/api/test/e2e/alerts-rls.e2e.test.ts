import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { AlertCount, ProfessionalAlert } from '@mycogni/contracts'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { careLinks, professionalAlerts } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { answer, linkPatient, severeWithRisk, testAlertJob } from '../support/alerts.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('professional alerts access', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let caio: TestUser
  let ana: TestUser
  let linkId: string
  let risk: ProfessionalAlert
  let severe: ProfessionalAlert

  function request(method: 'GET' | 'POST', url: string, user: TestUser) {
    return app.inject({ method, url, headers: bearer(user) })
  }

  async function alertsSeenBy(user: TestUser): Promise<ProfessionalAlert[]> {
    const response = await request('GET', '/v1/professional/alerts', user)
    expect(response.statusCode).toBe(200)
    return response.json<ProfessionalAlert[]>()
  }

  function rowsSeenBy(userId: string) {
    return withUser(connection.db, userId, (tx) =>
      tx.select({ id: professionalAlerts.id }).from(professionalAlerts),
    )
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    caio = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    await registerProfessional(connection.db, helena.id)
    await registerProfessional(connection.db, caio.id, { fullName: 'Dr. Caio Reis' })
    linkId = await linkPatient(app, helena, ana, false)
    const assessmentId = await answer(app, ana, 'phq9', severeWithRisk)
    await testAlertJob(connection.db, [helena.id]).run({
      kind: 'assessment',
      patientId: ana.id,
      assessmentId,
    })
    const alerts = await alertsSeenBy(helena)
    const byReason = (reason: string) => alerts.find((alert) => alert.reason === reason)
    const [foundRisk, foundSevere] = [byReason('risk_item'), byReason('severe_screening')]
    if (foundRisk === undefined || foundSevere === undefined) {
      throw new Error('Alerts were not raised')
    }
    risk = foundRisk
    severe = foundSevere
  })

  afterAll(async () => {
    for (const user of [helena, caio, ana]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('shows the professional their alerts with the patient name and the open count', async () => {
    expect(risk).toEqual(
      expect.objectContaining({ patientId: ana.id, patientName: 'Ana Lima', status: 'open' }),
    )
    const count = await request('GET', '/v1/professional/alerts/count', helena)
    expect(count.json<AlertCount>()).toEqual({ pending: 2, urgent: 1 })
  })

  it('shows nothing to another professional or to the patient', async () => {
    expect(await alertsSeenBy(caio)).toEqual([])
    expect(await rowsSeenBy(caio.id)).toEqual([])
    expect(await rowsSeenBy(ana.id)).toEqual([])
    expect((await request('GET', '/v1/professional/alerts', ana)).statusCode).toBe(403)
    expect((await request('GET', '/v1/professional/alerts/count', ana)).statusCode).toBe(403)
  })

  it('lets only the professional of the link acknowledge and resolve', async () => {
    expect(
      (await request('POST', `/v1/professional/alerts/${risk.id}/acknowledge`, caio)).statusCode,
    ).toBe(404)
    expect(
      (await request('POST', `/v1/professional/alerts/${risk.id}/resolve`, ana)).statusCode,
    ).toBe(403)
    const changed = await withUser(connection.db, caio.id, (tx) =>
      tx
        .update(professionalAlerts)
        .set({ resolvedAt: new Date() })
        .where(eq(professionalAlerts.id, risk.id))
        .returning({ id: professionalAlerts.id }),
    )
    expect(changed).toEqual([])

    expect(
      (await request('POST', `/v1/professional/alerts/${risk.id}/acknowledge`, helena)).statusCode,
    ).toBe(204)
    expect(
      (await request('POST', `/v1/professional/alerts/${risk.id}/resolve`, helena)).statusCode,
    ).toBe(204)
    expect(
      (await request('POST', `/v1/professional/alerts/${risk.id}/resolve`, helena)).statusCode,
    ).toBe(404)
    const [resolved] = (await alertsSeenBy(helena)).filter((alert) => alert.id === risk.id)
    expect(resolved?.status).toBe('resolved')
    expect(resolved?.acknowledgedAt).not.toBeNull()
  })

  it('never lets anyone signed in create alerts or change what they say', async () => {
    await expect(
      withUser(connection.db, helena.id, (tx) =>
        tx.insert(professionalAlerts).values({
          careLinkId: linkId,
          professionalId: helena.id,
          patientId: ana.id,
          reason: 'inactive',
          level: 'info',
        }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      withUser(connection.db, helena.id, (tx) =>
        tx
          .update(professionalAlerts)
          .set({ level: 'info' })
          .where(eq(professionalAlerts.id, severe.id)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
    await expect(
      withUser(connection.db, helena.id, (tx) =>
        tx.delete(professionalAlerts).where(eq(professionalAlerts.id, severe.id)),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('hides the alerts and their actions once the link ends', async () => {
    await connection.db
      .update(careLinks)
      .set({ endedAt: sql`now()`, endedBy: 'patient' })
      .where(eq(careLinks.id, linkId))

    expect(await alertsSeenBy(helena)).toEqual([])
    expect(
      (await request('POST', `/v1/professional/alerts/${severe.id}/resolve`, helena)).statusCode,
    ).toBe(404)
  })
})
