import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { ProfessionalAlert } from '@mycogni/contracts'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { AlertJob, AlertOutcome } from '../../src/modules/alerts/alert-job.ts'
import type { App } from '../../src/shared/http.ts'
import { linkPatient, send, testAlertJob } from '../support/alerts.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { lastMailTo, mailCountTo } from '../support/mailpit.ts'
import { createNoteQueue, type NoteQueue } from '../support/note-queue.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier, testConfig } from '../support/test-app.ts'

const urgent = 'Vontade de morrer'

const watch = 'Ando muito triste esses dias'

function documentOf(text: string) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

describe('professional alerts from written notes', () => {
  let app: App
  let connection: DatabaseConnection
  let queue: NoteQueue
  let job: AlertJob
  let helena: TestUser
  let marina: TestUser
  let nina: TestUser
  let otto: TestUser
  let paula: TestUser
  let marinaLink: string
  let paulaLink: string
  let ninaRecord: string
  let ottoRecord: string

  async function checkIn(patient: TestUser, note: string | null): Promise<string> {
    const response = await send(app, patient, '/v1/check-ins', {
      moodLevel: 1,
      emotions: [],
      contexts: [],
      note,
    })
    return response.json<{ id: string }>().id
  }

  async function addendum(patient: TestUser, checkInId: string, text: string): Promise<void> {
    await send(app, patient, `/v1/check-ins/${checkInId}/addenda`, { text })
  }

  async function newPage(patient: TestUser): Promise<string> {
    return (await send(app, patient, '/v1/journal')).json<{ id: string }>().id
  }

  async function savePage(patient: TestUser, id: string, text: string): Promise<void> {
    const response = await app.inject({
      method: 'PUT',
      url: `/v1/journal/${id}`,
      headers: bearer(patient),
      payload: { title: null, body: documentOf(text), plainText: text, imagePaths: [] },
    })
    expect(response.statusCode).toBe(200)
  }

  async function runQueued(): Promise<AlertOutcome> {
    const outcome: AlertOutcome = { raised: 0, emailed: 0 }
    for (const { trigger } of await queue.take()) {
      const result = await job.run(trigger)
      outcome.raised += result.raised
      outcome.emailed += result.emailed
    }
    return outcome
  }

  async function alertsOf(patient: TestUser): Promise<ProfessionalAlert[]> {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/professional/alerts?patientId=${patient.id}`,
      headers: bearer(helena),
    })
    expect(response.statusCode).toBe(200)
    return response.json<ProfessionalAlert[]>()
  }

  function summaryOf(alerts: readonly ProfessionalAlert[]) {
    return alerts.map(({ reason, level, status, checkInId, journalEntryId }) => ({
      reason,
      level,
      status,
      checkInId,
      journalEntryId,
    }))
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    queue = createNoteQueue()
    app = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      config: { ...testConfig, redisUrl: queue.redisUrl, queuePrefix: queue.prefix },
    })
    await app.ready()
    helena = await createTestUser()
    marina = await createTestUser({ full_name: 'Marina Costa' })
    nina = await createTestUser({ full_name: 'Nina Rocha' })
    otto = await createTestUser({ full_name: 'Otto Brandão' })
    paula = await createTestUser({ full_name: 'Paula Dias' })
    await registerProfessional(connection.db, helena.id)
    job = testAlertJob(connection.db, [helena.id])
    ninaRecord = await checkIn(nina, 'Antes do vínculo')
    ottoRecord = await checkIn(otto, 'Antes do vínculo')
    marinaLink = await linkPatient(app, helena, marina, false)
    await linkPatient(app, helena, nina, false)
    await linkPatient(app, helena, otto, true)
    paulaLink = await linkPatient(app, helena, paula, false)
    await queue.take()
  })

  afterAll(async () => {
    for (const user of [helena, marina, nina, otto, paula]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await queue.close()
    await connection.close()
  })

  it('raises an urgent alert for a note the professional can read and emails without the note', async () => {
    const checkInId = await checkIn(marina, urgent)

    expect(await runQueued()).toEqual({ raised: 1, emailed: 1 })
    expect(summaryOf(await alertsOf(marina))).toEqual([
      { reason: 'note_risk', level: 'urgent', status: 'open', checkInId, journalEntryId: null },
    ])
    const mail = await lastMailTo(helena.email)
    expect(mail?.Subject).toBe('Alerta urgente no MyCogniAI')
    expect(mail?.Text).toContain('Marina precisa da sua atenção')
    for (const detail of ['Vontade', 'morrer', 'nota', 'Costa', 'risco', 'suic']) {
      expect(mail?.HTML).not.toContain(detail)
      expect(mail?.Text).not.toContain(detail)
    }
  })

  it('keeps one open alert per reason and one email a day per patient', async () => {
    await checkIn(marina, `${urgent} de novo`)
    expect(await runQueued()).toEqual({ raised: 0, emailed: 0 })

    const [open] = await alertsOf(marina)
    await send(app, helena, `/v1/professional/alerts/${open?.id ?? ''}/resolve`)
    const checkInId = await checkIn(marina, urgent)

    expect(await runQueued()).toEqual({ raised: 1, emailed: 0 })
    expect(summaryOf(await alertsOf(marina))[0]).toEqual({
      reason: 'note_risk',
      level: 'urgent',
      status: 'open',
      checkInId,
      journalEntryId: null,
    })
    expect(await mailCountTo(helena.email)).toBe(1)
  })

  it('asks to watch a worrying note without an email and stays quiet on calm notes', async () => {
    const checkInId = await checkIn(marina, watch)
    await checkIn(marina, 'Dia tranquilo')

    expect(await runQueued()).toEqual({ raised: 1, emailed: 0 })
    expect(summaryOf(await alertsOf(marina))).toEqual(
      expect.arrayContaining([
        { reason: 'note_concern', level: 'watch', status: 'open', checkInId, journalEntryId: null },
      ]),
    )
    expect(await mailCountTo(helena.email)).toBe(1)
  })

  it('raises for a note added to an older record only when the history is shared', async () => {
    await addendum(nina, ninaRecord, urgent)
    await addendum(otto, ottoRecord, urgent)

    expect(await runQueued()).toEqual({ raised: 1, emailed: 1 })
    expect(await alertsOf(nina)).toEqual([])
    expect(summaryOf(await alertsOf(otto))).toEqual([
      {
        reason: 'note_risk',
        level: 'urgent',
        status: 'open',
        checkInId: ottoRecord,
        journalEntryId: null,
      },
    ])
  })

  it('raises for a note added to a record the professional can read', async () => {
    const recent = await checkIn(nina, 'Dia comum')
    await queue.take()
    await addendum(nina, recent, urgent)

    expect(await runQueued()).toEqual({ raised: 1, emailed: 1 })
    expect(summaryOf(await alertsOf(nina))).toEqual([
      {
        reason: 'note_risk',
        level: 'urgent',
        status: 'open',
        checkInId: recent,
        journalEntryId: null,
      },
    ])
  })

  it('never raises for a private MyBook page', async () => {
    const page = await newPage(paula)
    await savePage(paula, page, urgent)

    const [queued] = await queue.take()
    expect(queued?.trigger).toEqual({
      kind: 'note',
      note: { kind: 'journal', patientId: paula.id, entryId: page },
      level: 'urgent',
    })
    expect(queued === undefined ? null : await job.run(queued.trigger)).toEqual({
      raised: 0,
      emailed: 0,
    })
    expect(await alertsOf(paula)).toEqual([])
  })

  it('raises for a MyBook page shared with the professional', async () => {
    const shared = await newPage(paula)
    await send(app, paula, '/v1/journal/shares', {
      careLinkId: paulaLink,
      scope: 'entries',
      entryIds: [shared],
      expiresAt: null,
    })
    await savePage(paula, shared, urgent)

    expect(await runQueued()).toEqual({ raised: 1, emailed: 1 })
    expect(summaryOf(await alertsOf(paula))).toEqual([
      {
        reason: 'note_risk',
        level: 'urgent',
        status: 'open',
        checkInId: null,
        journalEntryId: shared,
      },
    ])
  })

  it('stops raising once the link ends', async () => {
    await send(app, marina, `/v1/care-links/${marinaLink}/end`)
    await checkIn(marina, urgent)

    expect(await runQueued()).toEqual({ raised: 0, emailed: 0 })
    expect(await alertsOf(marina)).toEqual([])
  })
})
