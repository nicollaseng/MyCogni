import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { MoodReportQuery } from '@mycogni/contracts'
import { dayKey, sharingConsentVersion } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { checkIns, insights } from '../../src/db/schema/index.ts'
import { createAssessmentRepository } from '../../src/modules/assessments/assessment.repository.ts'
import { createCareLinkRepository } from '../../src/modules/care-links/care-link.repository.ts'
import { createCheckInRepository } from '../../src/modules/check-ins/check-in.repository.ts'
import { createInsightRepository } from '../../src/modules/insights/insight.repository.ts'
import { createProfessionalRepository } from '../../src/modules/professionals/professional.repository.ts'
import { createProfileRepository } from '../../src/modules/profile/profile.repository.ts'
import type { ReportModel } from '../../src/modules/reports/report-model.ts'
import {
  createReportService,
  type ReportService,
} from '../../src/modules/reports/report.service.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { isPdf, pageCount } from '../support/pdf.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const timeZone = 'America/Sao_Paulo'

describe('/v1/reports/mood', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let caio: TestUser
  let ana: TestUser
  let bruno: TestUser
  let rendered: ReportModel[]
  let service: ReportService

  function get(path: string, user?: TestUser) {
    return app.inject({
      method: 'GET',
      url: path,
      headers: user === undefined ? {} : bearer(user),
    })
  }

  async function post(path: string, user: TestUser, payload?: object) {
    const response = await app.inject({ method: 'POST', url: path, headers: bearer(user), payload })
    expect(response.statusCode).toBeLessThan(300)
    return response.json<{ id: string; invitation: { code: string } }>()
  }

  async function checkInDaysAgo(daysAgo: number, moodLevel: number, note: string | null) {
    await connection.db.insert(checkIns).values({
      userId: ana.id,
      moodLevel,
      emotions: ['calm'],
      contexts: ['work'],
      note,
      recordedAt: sql`now() - make_interval(days => ${daysAgo})`,
    })
  }

  async function reading(audience: 'patient' | 'professional', summary: string) {
    await connection.db.insert(insights).values({
      patientId: ana.id,
      audience,
      professionalId: audience === 'professional' ? helena.id : null,
      periodStart: sql`now() - interval '6 days'`,
      periodEnd: sql`now() - interval '1 hour'`,
      checkInCount: 7,
      content:
        audience === 'patient'
          ? { summary, highlights: [], suggestions: [] }
          : { summary, trends: [], themes: [], attention: 'none', attentionReason: null },
      model: 'test',
    })
  }

  function query(overrides: Partial<MoodReportQuery> = {}): MoodReportQuery {
    return { days: 30, notes: false, reading: true, locale: 'pt-BR', ...overrides }
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    caio = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ full_name: 'Bruno Reis' })
    await registerProfessional(connection.db, helena.id)
    await registerProfessional(connection.db, caio.id, { status: 'pending' })
    await checkInDaysAgo(12, 2, 'Semana pesada no trabalho.')
    await checkInDaysAgo(5, 3, null)
    await post('/v1/assessments', ana, { instrument: 'phq9', answers: [1, 1, 1, 1, 1, 1, 0, 0, 0] })
    const { invitation } = await post('/v1/invitations', helena, {
      channel: 'link',
      locale: 'pt-BR',
    })
    const claimed = await post('/v1/invitations/claim', ana, { code: invitation.code })
    await post(`/v1/invitations/${claimed.id}/accept`, ana, {
      sharesHistory: false,
      consentVersion: sharingConsentVersion,
    })
    await post('/v1/check-ins', ana, {
      moodLevel: 5,
      emotions: ['joy'],
      contexts: ['friends'],
      note: 'Almoço com a Júlia.',
    })
    await reading('patient', 'Leitura para a Ana.')
    await reading('professional', 'Leitura para a Helena.')
    rendered = []
    service = createReportService({
      profiles: createProfileRepository(connection.db),
      checkIns: createCheckInRepository(connection.db),
      assessments: createAssessmentRepository(connection.db),
      insights: createInsightRepository(connection.db),
      careLinks: createCareLinkRepository(connection.db),
      professionals: createProfessionalRepository(connection.db),
      render: (model) => {
        rendered.push(model)
        return Promise.resolve(Buffer.from('%PDF-'))
      },
      now: () => new Date(),
    })
  })

  afterAll(async () => {
    for (const user of [helena, caio, ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('downloads the person’s own report as a named PDF', async () => {
    const response = await get('/v1/reports/mood?days=30&notes=true&reading=true&locale=pt-BR', ana)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('application/pdf')
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.headers['content-disposition']).toBe(
      `attachment; filename="mycogni-relatorio-${dayKey(new Date(), timeZone)}.pdf"`,
    )
    expect(isPdf(response.rawPayload)).toBe(true)
    expect(pageCount(response.rawPayload)).toBeGreaterThanOrEqual(1)
    expect(pageCount(response.rawPayload)).toBeLessThanOrEqual(3)
  })

  it('names the file in the language asked for', async () => {
    const response = await get('/v1/reports/mood?days=7&locale=en-GB', ana)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-disposition']).toMatch(/filename="mycogni-report-/)
  })

  it('only takes periods of 7 or 30 days and needs a session', async () => {
    expect((await get('/v1/reports/mood?days=14', ana)).statusCode).toBe(400)
    expect((await get('/v1/reports/mood?days=7&notes=sometimes', ana)).statusCode).toBe(400)
    expect((await get('/v1/reports/mood?days=7')).statusCode).toBe(401)
  })

  it('lets a linked professional download the patient’s report', async () => {
    const response = await get(`/v1/professional/patients/${ana.id}/reports/mood?days=7`, helena)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('application/pdf')
    expect(isPdf(response.rawPayload)).toBe(true)
  })

  it('hides patients who are not linked and refuses unverified professionals', async () => {
    expect(
      (await get(`/v1/professional/patients/${bruno.id}/reports/mood?days=7`, helena)).statusCode,
    ).toBe(404)
    expect(
      (await get(`/v1/professional/patients/${ana.id}/reports/mood?days=7`, caio)).statusCode,
    ).toBe(403)
    expect(
      (await get(`/v1/professional/patients/${ana.id}/reports/mood?days=7`, ana)).statusCode,
    ).toBe(403)
  })

  it('builds the patient report from all of the person’s records and the patient summary', async () => {
    await service.mine({ id: ana.id, email: ana.email }, query({ notes: true }))
    const model = rendered.at(-1)

    expect(model?.header.name).toBe('Ana Lima')
    expect(model?.kpis[0]?.value).toBe('3 de 30')
    expect(model?.screenings.rows.map((row) => row.score)).toEqual(['6 de 27'])
    expect(model?.reading?.summary).toBe('Leitura para a Ana.')
    expect(model?.notes?.entries.map((entry) => entry.text)).toEqual([
      'Semana pesada no trabalho.',
      'Almoço com a Júlia.',
    ])
  })

  it('gives the professional only what the patient file shows', async () => {
    await service.ofPatient({ id: helena.id, email: helena.email }, ana.id, query({ notes: true }))
    const model = rendered.at(-1)

    expect(model?.header.name).toBe('Ana Lima')
    expect(model?.kpis[0]?.value).toBe('1 de 30')
    expect(model?.screenings.rows).toEqual([])
    expect(model?.reading?.summary).toBe('Leitura para a Helena.')
    expect(model?.notes?.entries.map((entry) => entry.text)).toEqual(['Almoço com a Júlia.'])
  })

  it('leaves notes and the summary out when they are not asked for', async () => {
    await service.ofPatient(
      { id: helena.id, email: helena.email },
      ana.id,
      query({ notes: false, reading: false }),
    )
    const model = rendered.at(-1)

    expect(model?.notes).toBeNull()
    expect(model?.reading).toBeNull()
  })
})
