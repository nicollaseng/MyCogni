import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { PatientInsightContent, ProfessionalInsightContent } from '@mycogni/contracts'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq, sql } from 'drizzle-orm'
import type { InsightRecords, InsightWriter } from '../../src/ai/insight-writer.ts'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { checkIns, invitations, journalEntries, notifications } from '../../src/db/schema/index.ts'
import { expireInvitations } from '../../src/jobs/expire-invitations.ts'
import { createAssessmentRepository } from '../../src/modules/assessments/assessment.repository.ts'
import { createCheckInRepository } from '../../src/modules/check-ins/check-in.repository.ts'
import { createInsightJob, type InsightJob } from '../../src/modules/insights/insight-job.ts'
import { createInsightRepository } from '../../src/modules/insights/insight.repository.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional, seedInvitation } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

class RecordingWriter implements InsightWriter {
  readonly model = 'test-model'
  readonly patient: InsightRecords[] = []
  readonly professional: InsightRecords[] = []

  forPatient(records: InsightRecords): Promise<PatientInsightContent> {
    this.patient.push(records)
    return Promise.resolve({
      summary: `Semana com ${String(records.checkIns.length)} registros.`,
      highlights: ['O humor subiu no fim de semana.'],
      suggestions: [{ title: 'Caminhar', detail: 'Os dias com exercício foram melhores.' }],
    })
  }

  forProfessional(records: InsightRecords): Promise<ProfessionalInsightContent> {
    this.professional.push(records)
    return Promise.resolve({
      summary: 'Humor estável.',
      trends: ['Média 4,1.'],
      themes: ['trabalho'],
      attention: 'none',
      attentionReason: null,
    })
  }
}

describe('insights', () => {
  let app: App
  let connection: DatabaseConnection
  let helena: TestUser
  let ana: TestUser
  let bruno: TestUser
  let writer: RecordingWriter
  let job: InsightJob

  async function checkInsDaysAgo(user: TestUser, days: number[]): Promise<void> {
    for (const daysAgo of days) {
      await connection.db.insert(checkIns).values({
        userId: user.id,
        moodLevel: 4,
        emotions: ['calm'],
        contexts: ['work'],
        note: `nota de ${String(daysAgo)} dias`,
        recordedAt: sql`now() - make_interval(days => ${daysAgo})`,
      })
    }
  }

  async function post(user: TestUser, url: string, payload?: object) {
    const response = await app.inject({ method: 'POST', url, headers: bearer(user), payload })
    expect(response.statusCode).toBeLessThan(300)
    return response
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    helena = await createTestUser()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser()
    await registerProfessional(connection.db, helena.id)
    writer = new RecordingWriter()
    job = createInsightJob({
      insights: createInsightRepository(connection.db),
      checkIns: createCheckInRepository(connection.db),
      assessments: createAssessmentRepository(connection.db),
      writer,
      now: () => new Date(),
    })
  })

  afterAll(async () => {
    for (const user of [helena, ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('writes nothing without the consent for AI summaries', async () => {
    await checkInsDaysAgo(bruno, [1, 2, 3, 4, 5, 6, 7])

    expect(await job.run(bruno.id)).toEqual({ kind: 'skipped', reason: 'no_consent' })
    expect(writer.patient).toHaveLength(0)
  })

  it('waits for seven check-ins since the last summary', async () => {
    await post(ana, '/v1/consents', {
      kinds: ['terms', 'privacy', 'health_data', 'adult', 'ai_processing'],
    })
    await checkInsDaysAgo(ana, [20, 19, 18, 12, 10, 9])

    expect(await job.run(ana.id)).toEqual({ kind: 'skipped', reason: 'not_due' })
  })

  it('writes one summary for the person and one for the professional, each with what they may see', async () => {
    const { code } = await seedInvitation(connection.db, { professionalId: helena.id })
    const claimed = (await post(ana, '/v1/invitations/claim', { code })).json<{ id: string }>()
    await post(ana, `/v1/invitations/${claimed.id}/accept`, {
      sharesHistory: false,
      consentVersion: sharingConsentVersion,
    })
    await checkInsDaysAgo(ana, [0])
    await connection.db
      .insert(journalEntries)
      .values({ userId: ana.id, title: 'Privado', plainText: 'texto do diário' })

    const outcome = await job.run(ana.id)

    expect(outcome).toEqual(expect.objectContaining({ kind: 'written', professionalInsights: 1 }))
    expect(writer.patient.at(-1)?.checkIns).toHaveLength(7)
    expect(writer.patient.at(-1)?.journal).toEqual([])
    expect(writer.patient.at(-1)?.locale).toBe('pt-BR')
    expect(writer.professional.at(-1)?.checkIns).toHaveLength(1)
    expect(writer.professional.at(-1)?.journal).toEqual([])
    const bell = await connection.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ana.id))
    expect(bell.map((item) => item.kind)).toContain('insight')
  })

  it('starts counting again after a summary', async () => {
    await checkInsDaysAgo(ana, [0])

    expect(await job.run(ana.id)).toEqual({ kind: 'skipped', reason: 'not_due' })
  })

  it('includes the journal only when the person turns it on', async () => {
    await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: bearer(ana),
      payload: { journalInInsights: true },
    })
    await checkInsDaysAgo(ana, [0, 0, 0, 0, 0, 0])

    await job.run(ana.id)

    expect(writer.patient.at(-1)?.journal).toEqual([
      expect.objectContaining({ title: 'Privado', text: 'texto do diário' }),
    ])
    expect(writer.professional.at(-1)?.journal).toEqual([])
  })

  it('shows each audience only its own summaries', async () => {
    const mine = await app.inject({ method: 'GET', url: '/v1/insights', headers: bearer(ana) })
    const theirs = await app.inject({
      method: 'GET',
      url: `/v1/professional/patients/${ana.id}/insights`,
      headers: bearer(helena),
    })
    const stranger = await app.inject({
      method: 'GET',
      url: `/v1/professional/patients/${ana.id}/insights`,
      headers: bearer(bruno),
    })

    expect(mine.json<{ content: { suggestions: unknown[] } }[]>()).toHaveLength(2)
    expect(
      mine.json<{ content: { suggestions: unknown[] } }[]>()[0]?.content.suggestions,
    ).toHaveLength(1)
    expect(theirs.json<{ content: { attention: string } }[]>()[0]?.content.attention).toBe('none')
    expect(stranger.statusCode).toBe(403)
  })

  it('marks invitations that passed 72 hours as expired', async () => {
    const stale = await seedInvitation(connection.db, { professionalId: helena.id, expired: true })

    expect(await expireInvitations(connection.db)).toBeGreaterThanOrEqual(1)
    const [row] = await connection.db
      .select({ status: invitations.status })
      .from(invitations)
      .where(eq(invitations.id, stale.id))
    expect(row?.status).toBe('expired')
  })
})
