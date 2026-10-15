import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { ProfessionalAlert, ProfessionalInsightContent } from '@mycogni/contracts'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { careLinks, checkIns, insights } from '../../src/db/schema/index.ts'
import type { AlertJob } from '../../src/modules/alerts/alert-job.ts'
import type { App } from '../../src/shared/http.ts'
import { answer, linkPatient, send, severeWithRisk, testAlertJob } from '../support/alerts.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { lastMailTo, mailCountTo } from '../support/mailpit.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const watchSummary: ProfessionalInsightContent = {
  summary: 'Semana mais pesada.',
  trends: ['Humor em queda.'],
  themes: ['trabalho'],
  attention: 'watch',
  attentionReason: 'Humor caiu nos últimos dias.',
}

describe('professional alerts', () => {
  let app: App
  let connection: DatabaseConnection
  let job: AlertJob
  let helena: TestUser
  let ana: TestUser
  let bruno: TestUser
  let dora: TestUser
  let eva: TestUser
  let carla: TestUser
  let carlaLink: string

  async function alertsOf(patient?: TestUser): Promise<ProfessionalAlert[]> {
    const query = patient === undefined ? '' : `?patientId=${patient.id}`
    const response = await app.inject({
      method: 'GET',
      url: `/v1/professional/alerts${query}`,
      headers: bearer(helena),
    })
    expect(response.statusCode).toBe(200)
    return response.json<ProfessionalAlert[]>()
  }

  function summaryOf(alerts: readonly ProfessionalAlert[]) {
    return alerts.map(({ reason, level, status }) => ({ reason, level, status }))
  }

  async function checkInDaysAgo(user: TestUser, moodLevel: number, daysAgo: number) {
    await connection.db.insert(checkIns).values({
      userId: user.id,
      moodLevel,
      recordedAt: sql`now() - make_interval(days => ${daysAgo})`,
    })
  }

  async function professionalSummary(patient: TestUser, content: ProfessionalInsightContent) {
    const [row] = await connection.db
      .insert(insights)
      .values({
        patientId: patient.id,
        audience: 'professional',
        professionalId: helena.id,
        periodStart: sql`now() - interval '7 days'`,
        periodEnd: sql`now()`,
        checkInCount: 7,
        content,
        model: 'test-model',
      })
      .returning({ id: insights.id })
    return row?.id ?? ''
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ full_name: 'Bruno Reis' })
    dora = await createTestUser({ full_name: 'Dora Alves' })
    eva = await createTestUser({ full_name: 'Eva Prado' })
    carla = await createTestUser({ full_name: 'Carla Nunes' })
    await registerProfessional(connection.db, helena.id)
    job = testAlertJob(connection.db, [helena.id])
    for (const patient of [bruno, dora]) {
      for (const daysAgo of [5, 4, 3]) {
        await checkInDaysAgo(patient, 1, daysAgo)
      }
    }
    await linkPatient(app, helena, ana, false)
    await linkPatient(app, helena, bruno, true)
    await linkPatient(app, helena, dora, false)
    await linkPatient(app, helena, eva, false)
    carlaLink = await linkPatient(app, helena, carla, false)
  })

  afterAll(async () => {
    for (const user of [helena, ana, bruno, dora, eva, carla]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('raises an urgent alert for a positive item 9 and emails only that a patient needs attention', async () => {
    const assessmentId = await answer(app, ana, 'phq9', severeWithRisk)

    expect(await job.run({ kind: 'assessment', patientId: ana.id, assessmentId })).toEqual({
      raised: 2,
      emailed: 1,
    })
    expect(summaryOf(await alertsOf(ana))).toEqual(
      expect.arrayContaining([
        { reason: 'risk_item', level: 'urgent', status: 'open' },
        { reason: 'severe_screening', level: 'watch', status: 'open' },
      ]),
    )
    const mail = await lastMailTo(helena.email)
    expect(mail?.Subject).toBe('Alerta urgente no MyCogniAI')
    expect(mail?.Text).toContain('Ana precisa da sua atenção')
    expect(mail?.Text).toContain('Abrir alertas: http://localhost:3000/pro/alerts')
    for (const detail of ['Lima', 'PHQ', 'item', '26', 'grave', 'risco', 'suic']) {
      expect(mail?.HTML).not.toContain(detail)
      expect(mail?.Text).not.toContain(detail)
    }
  })

  it('keeps one open alert per reason when the same answer comes again', async () => {
    const assessmentId = await answer(app, ana, 'phq9', severeWithRisk)

    expect(await job.run({ kind: 'assessment', patientId: ana.id, assessmentId })).toEqual({
      raised: 0,
      emailed: 0,
    })
    expect(await alertsOf(ana)).toHaveLength(2)
    expect(await mailCountTo(helena.email)).toBe(1)
  })

  it('raises again once resolved, without a second email within 24 hours', async () => {
    const [risk] = (await alertsOf(ana)).filter((alert) => alert.reason === 'risk_item')
    await send(app, helena, `/v1/professional/alerts/${risk?.id ?? ''}/resolve`)
    const assessmentId = await answer(app, ana, 'phq9', severeWithRisk)

    expect(await job.run({ kind: 'assessment', patientId: ana.id, assessmentId })).toEqual({
      raised: 1,
      emailed: 0,
    })
    expect(summaryOf(await alertsOf(ana))).toEqual([
      { reason: 'risk_item', level: 'urgent', status: 'open' },
      { reason: 'severe_screening', level: 'watch', status: 'open' },
      { reason: 'risk_item', level: 'urgent', status: 'resolved' },
    ])
    expect(await mailCountTo(helena.email)).toBe(1)
  })

  it('asks to watch low mood only from the records the professional may see', async () => {
    for (const patient of [bruno, dora]) {
      await checkInDaysAgo(patient, 4, 0)
    }

    expect(await job.run({ kind: 'check-in', patientId: bruno.id })).toEqual({
      raised: 1,
      emailed: 0,
    })
    expect(await job.run({ kind: 'check-in', patientId: dora.id })).toEqual({
      raised: 0,
      emailed: 0,
    })
    expect(summaryOf(await alertsOf(bruno))).toEqual([
      { reason: 'low_mood', level: 'watch', status: 'open' },
    ])
    expect(await alertsOf(dora)).toEqual([])
  })

  it('does not reopen a mood alert during the week after it was raised', async () => {
    const [low] = await alertsOf(bruno)
    await send(app, helena, `/v1/professional/alerts/${low?.id ?? ''}/resolve`)
    await checkInDaysAgo(bruno, 1, 0)

    expect(await job.run({ kind: 'check-in', patientId: bruno.id })).toEqual({
      raised: 0,
      emailed: 0,
    })
  })

  it('follows the attention level of the professional summaries', async () => {
    const watchId = await professionalSummary(dora, watchSummary)
    const urgentId = await professionalSummary(bruno, { ...watchSummary, attention: 'urgent' })

    expect(await job.run({ kind: 'summary', insightId: watchId })).toEqual({
      raised: 1,
      emailed: 0,
    })
    expect(await job.run({ kind: 'summary', insightId: urgentId })).toEqual({
      raised: 1,
      emailed: 1,
    })
    expect(summaryOf(await alertsOf(dora))).toEqual([
      { reason: 'summary_watch', level: 'watch', status: 'open' },
    ])
    expect((await lastMailTo(helena.email))?.Text).toContain('Bruno precisa da sua atenção')
    expect(await mailCountTo(helena.email)).toBe(2)
  })

  it('reports a week without records on the daily review', async () => {
    await connection.db
      .update(careLinks)
      .set({ startedAt: sql`now() - interval '9 days'` })
      .where(eq(careLinks.patientId, eva.id))

    expect(await job.run({ kind: 'daily' })).toEqual({ raised: 1, emailed: 0 })
    expect(summaryOf(await alertsOf(eva))).toEqual([
      { reason: 'inactive', level: 'info', status: 'open' },
    ])
    expect(await job.run({ kind: 'daily' })).toEqual({ raised: 0, emailed: 0 })
  })

  it('stops alerting and hides past alerts once the link ends', async () => {
    const first = await answer(app, carla, 'phq9', severeWithRisk)
    expect(await job.run({ kind: 'assessment', patientId: carla.id, assessmentId: first })).toEqual(
      { raised: 2, emailed: 1 },
    )
    await send(app, carla, `/v1/care-links/${carlaLink}/end`)
    const second = await answer(app, carla, 'phq9', severeWithRisk)

    expect(
      await job.run({ kind: 'assessment', patientId: carla.id, assessmentId: second }),
    ).toEqual({ raised: 0, emailed: 0 })
    expect(await alertsOf(carla)).toEqual([])
    expect((await alertsOf()).map((alert) => alert.patientId)).not.toContain(carla.id)
  })
})
