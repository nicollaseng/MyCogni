import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type {
  NotificationList,
  PatientQuestionnaires,
  ProfessionalAlert,
  ProfessionalAssignment,
  QuestionnaireRun,
} from '@mycogni/contracts'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { questionnaireAssignments, questionnaireResponses } from '../../src/db/schema/index.ts'
import { createMailer } from '../../src/mail/mailer.ts'
import { createExportCollector } from '../../src/modules/exports/export-collector.ts'
import { createQuestionnaireNotifier } from '../../src/modules/questionnaires/questionnaire-notifier.ts'
import type { App } from '../../src/shared/http.ts'
import { linkPatient, testAlertJob } from '../support/alerts.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { phq9Calm, phq9WithRisk } from '../support/questionnaires.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  professionalAccount,
  type TestUser,
} from '../support/supabase.ts'
import { allowedOrigin, buildTestApp, supabaseVerifier, testConfig } from '../support/test-app.ts'

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

const dayInMs = 24 * 60 * 60 * 1000

describe('questionnaire lifecycle', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let rui: TestUser
  let ana: TestUser
  let carla: TestUser
  let anaLink: string

  function call(method: Method, url: string, user: TestUser, payload?: object, target = app) {
    return target.inject({ method, url: `/v1${url}`, headers: bearer(user), payload })
  }

  async function json<T>(method: Method, url: string, user: TestUser, payload?: object) {
    const response = await call(method, url, user, payload)
    expect(response.statusCode).toBeLessThan(300)
    return response.json<T>()
  }

  async function release(patient: TestUser, by: TestUser, payload: object) {
    return json<ProfessionalAssignment>(
      'POST',
      `/professional/patients/${patient.id}/questionnaires`,
      by,
      payload,
    )
  }

  async function answerAll(id: string, patient: TestUser, answers: readonly number[]) {
    await json('POST', `/questionnaires/${id}/start`, patient, { locale: 'pt-BR' })
    for (const [item, value] of answers.entries()) {
      await json('PATCH', `/questionnaires/${id}/answers`, patient, { item, value })
    }
    return json<QuestionnaireRun>('POST', `/questionnaires/${id}/complete`, patient)
  }

  function assignmentRow(id: string) {
    return connection.db
      .select()
      .from(questionnaireAssignments)
      .where(eq(questionnaireAssignments.id, id))
      .then(([row]) => row)
  }

  const notifier = () =>
    createQuestionnaireNotifier({
      db: connection.db,
      mailer: createMailer(testConfig.mail, { error: () => undefined }),
      webUrl: allowedOrigin,
    })

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser(professionalAccount)
    rui = await createTestUser(professionalAccount)
    ana = await createTestUser({ full_name: 'Ana Lima', locale: 'pt-BR' })
    carla = await createTestUser({ full_name: 'Carla Dias', locale: 'pt-BR' })
    await registerProfessional(connection.db, helena.id)
    await registerProfessional(connection.db, rui.id, { fullName: 'Dr. Rui Matos' })
    anaLink = await linkPatient(app, helena, ana, false)
    await linkPatient(app, rui, ana, false)
    await linkPatient(app, helena, carla, false)
  })

  afterAll(async () => {
    for (const user of [helena, rui, ana, carla]) {
      await deleteTestUser(user.id).catch(() => undefined)
    }
    await app.close()
    await connection.close()
  })

  it('raises the urgent alert only for the professional who released the PHQ-9', async () => {
    const phq = await release(ana, helena, { variant: 'phq9' })
    const done = await answerAll(phq.id, ana, phq9WithRisk)
    const [response] = await connection.db
      .select({ id: questionnaireResponses.id, flags: questionnaireResponses.flags })
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.assignmentId, phq.id))
    await testAlertJob(connection.db, [helena.id, rui.id]).run({
      kind: 'questionnaire',
      patientId: ana.id,
      responseId: response?.id ?? '',
    })

    expect(done.summary).toEqual({ area: 'depression', level: 'low', safety: true })
    expect(response?.flags).toEqual(['risk_item'])
    const alerts = await json<ProfessionalAlert[]>('GET', '/professional/alerts', helena)
    expect(alerts).toEqual([
      expect.objectContaining({ patientId: ana.id, reason: 'risk_item', level: 'urgent' }),
    ])
    expect(await json<ProfessionalAlert[]>('GET', '/professional/alerts', rui)).toEqual([])
  })

  it('opens the next repetition when the patient finishes a repeating questionnaire', async () => {
    const k10 = await release(ana, helena, { variant: 'k10', repeatEveryDays: 7 })
    const done = await answerAll(
      k10.id,
      ana,
      Array.from({ length: 10 }, () => 2),
    )
    const list = await json<ProfessionalAssignment[]>(
      'GET',
      `/professional/patients/${ana.id}/questionnaires`,
      helena,
    )
    const next = list.find((item) => item.variant === 'k10' && item.status === 'assigned')
    const finished = await assignmentRow(k10.id)

    expect(done.summary).toEqual({ area: 'distress', level: 'mild', safety: false })
    expect(next).toEqual(expect.objectContaining({ repeatEveryDays: 7 }))
    expect(Date.parse(next?.availableFrom ?? '')).toBe(
      (finished?.completedAt?.getTime() ?? 0) + 7 * dayInMs,
    )
    const patientView = await json<PatientQuestionnaires>('GET', '/questionnaires', ana)
    expect(patientView.open.map((item) => item.id)).not.toContain(next?.id)
    expect((await call('GET', `/questionnaires/${next?.id ?? ''}`, ana)).statusCode).toBe(404)
  })

  it('tells the patient once a repetition is due and expires forgotten ones', async () => {
    const [due] = await connection.db
      .update(questionnaireAssignments)
      .set({ availableFrom: sql`now() - interval '1 minute'` })
      .where(
        sql`${questionnaireAssignments.patientId} = ${ana.id} and ${questionnaireAssignments.status} = 'assigned' and ${questionnaireAssignments.variant} = 'k10'`,
      )
      .returning({ id: questionnaireAssignments.id })
    const stale = await release(carla, helena, { variant: 'asrs6' })
    await connection.db
      .update(questionnaireAssignments)
      .set({ availableFrom: sql`now() - interval '31 days'` })
      .where(eq(questionnaireAssignments.id, stale.id))

    const sweep = await notifier().sweep()
    const bell = await json<NotificationList>('GET', '/notifications', ana)

    expect(sweep.notified).toBeGreaterThanOrEqual(1)
    expect(sweep.expired).toBeGreaterThanOrEqual(1)
    expect(bell.items[0]?.questionnaire?.assignmentId).toBe(due?.id)
    expect((await assignmentRow(due?.id ?? ''))?.notifiedAt).toBeInstanceOf(Date)
    expect((await assignmentRow(stale.id))?.status).toBe('expired')
    expect(await notifier().released(due?.id ?? '')).toBe(false)
  })

  it('lets the professional cancel an open questionnaire and closes it for the patient', async () => {
    const pcl = await release(ana, helena, { variant: 'pcl5' })
    await json('POST', `/questionnaires/${pcl.id}/start`, ana, { locale: 'pt-BR' })
    const url = `/professional/patients/${ana.id}/questionnaires/${pcl.id}/cancel`

    expect((await call('POST', url, rui)).statusCode).toBe(404)
    expect((await call('POST', url, ana)).statusCode).toBe(403)
    expect((await call('POST', url, helena)).statusCode).toBe(204)
    expect((await call('POST', url, helena)).statusCode).toBe(404)
    const closed = await call('PATCH', `/questionnaires/${pcl.id}/answers`, ana, {
      item: 0,
      value: 1,
    })
    expect(closed.statusCode).toBe(409)
    expect(closed.json<{ code: string }>().code).toBe('QUESTIONNAIRE_CLOSED')
    expect((await assignmentRow(pcl.id))?.cancelledAt).toBeInstanceOf(Date)
  })

  it('includes questionnaires in the patient data export', async () => {
    const data = await createExportCollector(connection.db).collect(ana.id)

    expect(data.questionnaires.length).toBeGreaterThanOrEqual(3)
    expect(data.questionnaires).toContainEqual(
      expect.objectContaining({
        variant: 'phq9',
        status: 'completed',
        professionalName: 'Dra. Helena Prado',
        response: expect.objectContaining({ flags: ['risk_item'], locale: 'pt-BR' }),
      }),
    )
  })

  it('cancels open questionnaires when the patient ends the link', async () => {
    const open = await release(ana, helena, { variant: 'phq8' })
    expect((await call('POST', `/care-links/${anaLink}/end`, ana)).statusCode).toBe(204)

    expect((await assignmentRow(open.id))?.status).toBe('cancelled')
    expect(
      (await call('GET', `/professional/patients/${ana.id}/questionnaires`, helena)).statusCode,
    ).toBe(404)
    const view = await json<PatientQuestionnaires>('GET', '/questionnaires', ana)
    expect(view.open.map((item) => item.id)).not.toContain(open.id)
    expect(view.answered.length).toBeGreaterThan(0)
  })

  it('limits how many questionnaires a professional releases in an hour', async () => {
    const limited = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      config: {
        ...testConfig,
        redisUrl: 'redis://127.0.0.1:56379',
        queuePrefix: `test-${randomUUID().slice(0, 8)}`,
      },
    })
    await limited.ready()
    const statuses: number[] = []
    for (let attempt = 0; attempt < 31; attempt += 1) {
      const response = await call(
        'POST',
        `/professional/patients/${ana.id}/questionnaires`,
        rui,
        { variant: 'phq9', note: String(attempt) },
        limited,
      )
      statuses.push(response.statusCode)
    }
    const blocked = await call(
      'POST',
      `/professional/patients/${ana.id}/questionnaires`,
      rui,
      { variant: 'phq9' },
      limited,
    )
    await limited.close()

    expect(statuses[0]).toBe(201)
    expect(statuses.slice(1, 30).every((status) => status === 409)).toBe(true)
    expect(statuses[30]).toBe(429)
    expect(blocked.json<{ code: string }>().code).toBe('QUESTIONNAIRE_LIMIT')
  })

  it('deletes every questionnaire row with the patient account', async () => {
    const before = await connection.db
      .select({ id: questionnaireAssignments.id })
      .from(questionnaireAssignments)
      .where(eq(questionnaireAssignments.patientId, ana.id))
    expect(before.length).toBeGreaterThan(0)
    expect(phq9Calm).toHaveLength(9)

    expect((await call('DELETE', '/me', ana)).statusCode).toBe(204)
    const assignments = await connection.db
      .select({ id: questionnaireAssignments.id })
      .from(questionnaireAssignments)
      .where(eq(questionnaireAssignments.patientId, ana.id))
    const responses = await connection.db
      .select({ id: questionnaireResponses.id })
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.patientId, ana.id))
    expect(assignments).toEqual([])
    expect(responses).toEqual([])
  })
})
