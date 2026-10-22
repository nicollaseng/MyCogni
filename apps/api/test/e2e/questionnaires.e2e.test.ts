import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type {
  AssignmentDetail,
  NotificationList,
  PatientQuestionnaires,
  ProfessionalAssignment,
  QuestionnaireCatalog,
  QuestionnaireRun,
} from '@mycogni/contracts'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { professionalProfiles, questionnaireResponses } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { linkPatient } from '../support/alerts.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { mailMatching } from '../support/mailpit.ts'
import {
  bearer,
  createTestUser,
  deleteTestUser,
  professionalAccount,
  type TestUser,
} from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

type Method = 'GET' | 'POST' | 'PATCH'

describe('/v1 questionnaires', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let rui: TestUser
  let ana: TestUser
  let joana: TestUser
  let bruno: TestUser
  let released: ProfessionalAssignment

  function call(method: Method, url: string, user: TestUser, payload?: object) {
    return app.inject({ method, url: `/v1${url}`, headers: bearer(user), payload })
  }

  async function json<T>(method: Method, url: string, user: TestUser, payload?: object) {
    const response = await call(method, url, user, payload)
    expect(response.statusCode).toBeLessThan(300)
    return response.json<T>()
  }

  function releaseTo(patient: TestUser, by: TestUser, payload: object) {
    return call('POST', `/professional/patients/${patient.id}/questionnaires`, by, payload)
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser(professionalAccount)
    rui = await createTestUser(professionalAccount)
    ana = await createTestUser({ full_name: 'Ana Lima', locale: 'pt-BR' })
    joana = await createTestUser({ full_name: 'Joana Reis', locale: 'pt-PT' })
    bruno = await createTestUser({ locale: 'pt-BR' })
    await registerProfessional(connection.db, helena.id)
    await registerProfessional(connection.db, rui.id, { fullName: 'Dr. Rui Matos' })
    await connection.db
      .update(professionalProfiles)
      .set({ kind: 'psychiatrist' })
      .where(eq(professionalProfiles.userId, rui.id))
    await linkPatient(app, helena, ana, false)
    await linkPatient(app, rui, ana, false)
    await linkPatient(app, rui, joana, false)
  }, 30_000)

  afterAll(async () => {
    for (const user of [helena, rui, ana, joana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('offers the catalog by condition and keeps the GAD-7 away from psychologists', async () => {
    const catalog = await json<QuestionnaireCatalog>(
      'GET',
      `/professional/patients/${ana.id}/questionnaires/catalog`,
      helena,
    )
    const options = catalog.areas.flatMap((area) => area.options)

    expect(catalog.patientLocale).toBe('pt-BR')
    expect(catalog.complementarySource).toBe(true)
    expect(catalog.areas.map((area) => area.area)).toEqual([
      'depression',
      'anxiety',
      'trauma',
      'attention',
      'distress',
    ])
    expect(options.find((option) => option.variant === 'gad7')).toEqual(
      expect.objectContaining({
        unavailableReason: 'satepsi_not_evaluated',
        satepsi: { status: 'nao_avaliado', checkedOn: '2026-10-22' },
      }),
    )
    expect(options.find((option) => option.variant === 'phq9')).toEqual(
      expect.objectContaining({ unavailableReason: null, safetyItem: true, minutes: 3 }),
    )
    expect(options.find((option) => option.variant === 'k6')?.unavailableReason).toBe(
      'no_official_text',
    )
  })

  it('offers the GAD-7 to physicians and disables what has no text in the patient language', async () => {
    const catalog = await json<QuestionnaireCatalog>(
      'GET',
      `/professional/patients/${joana.id}/questionnaires/catalog`,
      rui,
    )
    const reasons = Object.fromEntries(
      catalog.areas.flatMap((area) =>
        area.options.map((option) => [option.variant, option.unavailableReason]),
      ),
    )

    expect(catalog.patientLocale).toBe('pt-PT')
    expect(catalog.complementarySource).toBe(false)
    expect(reasons).toEqual({
      phq9: null,
      phq8: null,
      gad7: null,
      pcl5: 'no_official_text',
      asrs6: null,
      k10: 'no_official_text',
      k6: 'no_official_text',
    })
  })

  it('refuses the catalog and releases without an active link', async () => {
    expect(
      (await call('GET', `/professional/patients/${bruno.id}/questionnaires/catalog`, helena))
        .statusCode,
    ).toBe(404)
    const response = await releaseTo(bruno, helena, { variant: 'phq9' })
    expect(response.statusCode).toBe(404)
    expect(
      (await call('GET', `/professional/patients/${ana.id}/questionnaires/catalog`, ana))
        .statusCode,
    ).toBe(403)
  })

  it('enforces the SATEPSI rule and the patient language in the API too', async () => {
    const gad = await releaseTo(ana, helena, { variant: 'gad7' })
    expect(gad.statusCode).toBe(403)
    expect(gad.json<{ code: string }>().code).toBe('QUESTIONNAIRE_NOT_ALLOWED')

    const kessler = await releaseTo(joana, rui, { variant: 'k10' })
    expect(kessler.statusCode).toBe(422)
    expect(kessler.json<{ code: string }>().code).toBe('QUESTIONNAIRE_LANGUAGE_UNAVAILABLE')
  })

  it('validates the release', async () => {
    for (const payload of [
      { variant: 'who5' },
      { variant: 'pcl5_8' },
      { variant: 'phq9', note: 'x'.repeat(281) },
      { variant: 'phq9', repeatEveryDays: 30 },
    ]) {
      expect((await releaseTo(ana, helena, payload)).statusCode).toBe(400)
    }
  })

  it('releases a questionnaire and tells the patient without naming it', async () => {
    const response = await releaseTo(ana, helena, {
      variant: 'phq9',
      note: '  Antes da nossa consulta, por favor.  ',
      repeatEveryDays: null,
    })
    released = response.json<ProfessionalAssignment>()

    expect(response.statusCode).toBe(201)
    expect(released).toEqual(
      expect.objectContaining({
        patientId: ana.id,
        variant: 'phq9',
        instrument: 'phq',
        status: 'assigned',
        note: 'Antes da nossa consulta, por favor.',
        repeatEveryDays: null,
        result: null,
      }),
    )
    const bell = await json<NotificationList>('GET', '/notifications', ana)
    expect(bell.items[0]).toEqual(
      expect.objectContaining({
        kind: 'questionnaire_assigned',
        questionnaire: expect.objectContaining({ assignmentId: released.id }),
      }),
    )
    const mail = await mailMatching(ana.email, 'Seu profissional liberou um questionário para você')
    expect(mail.Text).toContain(`/questionnaires/${released.id}`)
    for (const word of ['PHQ', 'depress', 'Ânimo', 'ânimo']) {
      expect(mail.HTML).not.toContain(word)
      expect(mail.Text).not.toContain(word)
    }
  })

  it('keeps one open questionnaire of each kind', async () => {
    const again = await releaseTo(ana, helena, { variant: 'phq9' })
    expect(again.statusCode).toBe(409)
    expect(again.json<{ code: string }>().code).toBe('QUESTIONNAIRE_ALREADY_OPEN')
  })

  it('lists the open questionnaire for the patient in plain words only', async () => {
    const list = await json<PatientQuestionnaires>('GET', '/questionnaires', ana)

    expect(list.answered).toEqual([])
    expect(list.open).toEqual([
      {
        id: released.id,
        area: 'depression',
        status: 'assigned',
        itemCount: 9,
        minutes: 3,
        answered: 0,
        note: 'Antes da nossa consulta, por favor.',
        availableFrom: released.availableFrom,
        professional: { name: 'Dra. Helena Prado', kind: 'psychologist' },
      },
    ])
    expect(JSON.stringify(list)).not.toContain('phq')
    expect((await call('GET', '/questionnaires', helena)).statusCode).toBe(403)
    expect((await call('GET', `/questionnaires/${released.id}`, bruno)).statusCode).toBe(404)
  })

  it('records the notice consent on start and serves the official text', async () => {
    const before = await json<QuestionnaireRun>('GET', `/questionnaires/${released.id}`, ana)
    expect(before.content).toBeNull()
    expect(before.answers).toEqual(Array.from({ length: 9 }, () => null))

    const run = await json<QuestionnaireRun>('POST', `/questionnaires/${released.id}/start`, ana, {
      locale: 'pt-BR',
    })
    const [response] = await connection.db
      .select({ consentedAt: questionnaireResponses.consentedAt })
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.assignmentId, released.id))

    expect(response?.consentedAt).toBeInstanceOf(Date)
    expect(run.status).toBe('in_progress')
    expect(run.content).toEqual(
      expect.objectContaining({
        locale: 'pt-BR',
        lead: 'Durante as últimas 2 semanas, com que freqüência você foi incomodado/a por qualquer um dos problemas abaixo?',
        stem: null,
        notice: null,
      }),
    )
    expect(run.content?.items[8]).toBe(
      'Pensar em se ferir de alguma maneira ou que seria melhor estar morto/a',
    )
    expect(JSON.stringify(run)).not.toContain('PHQ')
    const again = await json<QuestionnaireRun>(
      'POST',
      `/questionnaires/${released.id}/start`,
      ana,
      { locale: 'en-US' },
    )
    expect(again.content?.locale).toBe('pt-BR')
  })

  it('saves answers one at a time so the patient can pause and resume', async () => {
    for (const [item, value] of [
      [0, 1],
      [1, 1],
      [2, 0],
    ] as const) {
      await json('PATCH', `/questionnaires/${released.id}/answers`, ana, { item, value })
    }
    const resumed = await json<QuestionnaireRun>('GET', `/questionnaires/${released.id}`, ana)
    const list = await json<PatientQuestionnaires>('GET', '/questionnaires', ana)

    expect(resumed.answers).toEqual([1, 1, 0, null, null, null, null, null, null])
    expect(list.open[0]?.answered).toBe(3)
    for (const payload of [
      { item: 9, value: 1 },
      { item: 0, value: 4 },
    ]) {
      const invalid = await call('PATCH', `/questionnaires/${released.id}/answers`, ana, payload)
      expect(invalid.statusCode).toBe(422)
    }
    expect(
      (await call('PATCH', `/questionnaires/${released.id}/answers`, bruno, { item: 0, value: 1 }))
        .statusCode,
    ).toBe(404)
  })

  it('refuses to finish before every question is answered', async () => {
    const early = await call('POST', `/questionnaires/${released.id}/complete`, ana)
    expect(early.statusCode).toBe(422)
    expect(early.json<{ code: string }>().code).toBe('QUESTIONNAIRE_INCOMPLETE')
  })

  it('scores on the server and gives the patient a plain summary', async () => {
    for (const [item, value] of [
      [3, 2],
      [4, 1],
      [5, 1],
      [6, 0],
      [7, 0],
      [8, 0],
    ] as const) {
      await json('PATCH', `/questionnaires/${released.id}/answers`, ana, { item, value })
    }
    const done = await json<QuestionnaireRun>(
      'POST',
      `/questionnaires/${released.id}/complete`,
      ana,
    )

    expect(done.status).toBe('completed')
    expect(done.summary).toEqual({ area: 'depression', level: 'mild', safety: false })
    expect(JSON.stringify(done)).not.toMatch(/"total"|"band"|"score"/)
    const list = await json<PatientQuestionnaires>('GET', '/questionnaires', ana)
    expect(list.open).toEqual([])
    expect(list.answered).toEqual([
      expect.objectContaining({
        id: released.id,
        area: 'depression',
        summary: { area: 'depression', level: 'mild', safety: false },
      }),
    ])
    expect((await call('POST', `/questionnaires/${released.id}/complete`, ana)).statusCode).toBe(
      409,
    )
  })

  it('tells the professional in the bell and shows the full result', async () => {
    const bell = await json<NotificationList>('GET', '/notifications', helena)
    expect(bell.items[0]).toEqual(
      expect.objectContaining({
        kind: 'questionnaire_completed',
        questionnaire: { assignmentId: released.id, patientId: ana.id, patientName: 'Ana Lima' },
      }),
    )

    const list = await json<ProfessionalAssignment[]>(
      'GET',
      `/professional/patients/${ana.id}/questionnaires`,
      helena,
    )
    expect(list[0]).toEqual(
      expect.objectContaining({
        id: released.id,
        status: 'completed',
        result: { total: 6, max: 27, band: 'mild', flags: [] },
      }),
    )
    const detail = await json<AssignmentDetail>(
      'GET',
      `/professional/patients/${ana.id}/questionnaires/${released.id}`,
      helena,
    )
    expect(detail.complementarySource).toBe(true)
    expect(detail.response).toEqual(
      expect.objectContaining({
        locale: 'pt-BR',
        instrumentVersion: 'phq9@1',
        answers: [1, 1, 0, 2, 1, 1, 0, 0, 0],
        flags: [],
        score: expect.objectContaining({ total: 6, band: 'mild', provisional: null }),
      }),
    )
    expect(detail.trend).toEqual([
      {
        assignmentId: released.id,
        completedAt: detail.response?.completedAt,
        total: 6,
        band: 'mild',
      },
    ])
  })

  it('keeps the result away from another professional of the same patient', async () => {
    expect(
      (await call('GET', `/professional/patients/${ana.id}/questionnaires/${released.id}`, rui))
        .statusCode,
    ).toBe(404)
    expect(
      await json<ProfessionalAssignment[]>(
        'GET',
        `/professional/patients/${ana.id}/questionnaires`,
        rui,
      ),
    ).toEqual([])
  })

  it('scores the PCL-5 clusters and asks the professional to consider a suicide screening', async () => {
    const pcl = (await releaseTo(ana, helena, { variant: 'pcl5' })).json<ProfessionalAssignment>()
    await json('POST', `/questionnaires/${pcl.id}/start`, ana, { locale: 'pt-BR' })
    for (let item = 0; item < 20; item += 1) {
      await json('PATCH', `/questionnaires/${pcl.id}/answers`, ana, { item, value: 2 })
    }
    const done = await json<QuestionnaireRun>('POST', `/questionnaires/${pcl.id}/complete`, ana)
    const detail = await json<AssignmentDetail>(
      'GET',
      `/professional/patients/${ana.id}/questionnaires/${pcl.id}`,
      helena,
    )

    expect(done.summary).toEqual({ area: 'trauma', level: 'moderate', safety: false })
    expect(detail.response?.flags).toEqual(['suicide_screen'])
    expect(detail.response?.score).toEqual(
      expect.objectContaining({ total: 40, band: 'above_cutoff', provisional: true }),
    )
    expect(detail.response?.score.clusters.map((cluster) => cluster.id)).toEqual([
      'b',
      'c',
      'd',
      'e',
    ])
  })

  it('serves the ASRS with its notice and counts the shaded answers', async () => {
    const asrs = (await releaseTo(joana, rui, { variant: 'asrs6' })).json<ProfessionalAssignment>()
    const run = await json<QuestionnaireRun>('POST', `/questionnaires/${asrs.id}/start`, joana, {
      locale: 'pt-PT',
    })
    for (const [item, value] of [2, 2, 2, 3, 3, 3].entries()) {
      await json('PATCH', `/questionnaires/${asrs.id}/answers`, joana, { item, value })
    }
    await json('POST', `/questionnaires/${asrs.id}/complete`, joana)
    const detail = await json<AssignmentDetail>(
      'GET',
      `/professional/patients/${joana.id}/questionnaires/${asrs.id}`,
      rui,
    )

    expect(run.content?.notice).toBe(
      '© New York University and the President and Fellows of Harvard College',
    )
    expect(detail.complementarySource).toBe(false)
    expect(detail.response?.score).toEqual(
      expect.objectContaining({
        total: 15,
        band: 'low_positive',
        shaded: { count: 6, positive: true },
      }),
    )
  })

  it('refuses to start in a language without an official text', async () => {
    const kessler = (await releaseTo(ana, rui, { variant: 'k10' })).json<ProfessionalAssignment>()
    const response = await call('POST', `/questionnaires/${kessler.id}/start`, ana, {
      locale: 'pt-PT',
    })
    expect(response.statusCode).toBe(422)
    expect(response.json<{ code: string }>().code).toBe('QUESTIONNAIRE_LANGUAGE_UNAVAILABLE')
  })
})
