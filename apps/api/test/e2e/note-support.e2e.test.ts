import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { RecordedAddendum, RecordedCheckIn, SavedJournalEntry } from '@mycogni/contracts'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { createNoteQueue, type NoteQueue } from '../support/note-queue.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier, testConfig } from '../support/test-app.ts'

type Method = 'POST' | 'PUT'

const urgent = 'Vontade de morrer'

const watch = 'Ando muito triste esses dias'

const calm = 'Dia tranquilo, caminhei no parque'

const allowedKeys = [
  'level',
  'time',
  'pid',
  'hostname',
  'msg',
  'support',
  'kind',
  'patientId',
  'checkInId',
  'addendumId',
  'entryId',
]

function documentOf(text: string) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

describe('support signal on saved notes', () => {
  let app: App
  let connection: DatabaseConnection
  let queue: NoteQueue
  let marina: TestUser
  const lines: string[] = []

  function call(method: Method, url: string, payload?: object) {
    return app.inject({
      method,
      url,
      headers: bearer(marina),
      ...(payload === undefined ? {} : { payload }),
    })
  }

  async function checkIn(note: string | null): Promise<RecordedCheckIn> {
    const response = await call('POST', '/v1/check-ins', {
      moodLevel: 0,
      emotions: [],
      contexts: [],
      note,
    })
    expect(response.statusCode).toBe(201)
    return response.json<RecordedCheckIn>()
  }

  async function addendum(checkInId: string, text: string): Promise<RecordedAddendum> {
    const response = await call('POST', `/v1/check-ins/${checkInId}/addenda`, { text })
    expect(response.statusCode).toBe(201)
    return response.json<RecordedAddendum>()
  }

  async function newPage(): Promise<string> {
    return (await call('POST', '/v1/journal')).json<{ id: string }>().id
  }

  async function savePage(id: string, text: string): Promise<SavedJournalEntry> {
    const response = await call('PUT', `/v1/journal/${id}`, {
      title: null,
      body: documentOf(text),
      plainText: text,
      imagePaths: [],
    })
    expect(response.statusCode).toBe(200)
    return response.json<SavedJournalEntry>()
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    queue = createNoteQueue()
    app = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      config: {
        ...testConfig,
        logLevel: 'info',
        redisUrl: queue.redisUrl,
        queuePrefix: queue.prefix,
      },
      logStream: { write: (line) => lines.push(line) },
    })
    await app.ready()
    marina = await createTestUser({ full_name: 'Marina Costa' })
  })

  afterAll(async () => {
    await deleteTestUser(marina.id)
    await app.close()
    await queue.close()
    await connection.close()
  })

  it('answers the level of a check-in note and keeps the save', async () => {
    const levels = [
      (await checkIn(urgent)).support,
      (await checkIn(watch)).support,
      (await checkIn(calm)).support,
      (await checkIn(null)).support,
    ]

    expect(levels).toEqual([
      { level: 'urgent' },
      { level: 'watch' },
      { level: 'none' },
      { level: 'none' },
    ])
    const listed = await app.inject({
      method: 'GET',
      url: '/v1/check-ins?limit=4',
      headers: bearer(marina),
    })
    expect(listed.json<{ note: string | null }[]>().map(({ note }) => note)).toEqual([
      null,
      calm,
      watch,
      urgent,
    ])
  })

  it('answers the level of each note added to a record', async () => {
    const { id } = await checkIn(calm)

    expect((await addendum(id, urgent)).support).toEqual({ level: 'urgent' })
    expect((await addendum(id, watch)).support).toEqual({ level: 'watch' })
    expect((await addendum(id, calm)).support).toEqual({ level: 'none' })
  })

  it('answers when a MyBook save raises the level of the page', async () => {
    const quiet = await newPage()
    const heavy = await newPage()

    expect((await savePage(quiet, calm)).support).toEqual({ level: 'none' })
    expect((await savePage(quiet, `${calm}. ${watch}`)).support).toEqual({ level: 'watch' })
    expect((await savePage(heavy, urgent)).support).toEqual({ level: 'urgent' })
    expect((await savePage(heavy, `${urgent}. Liguei para o CVV.`)).support).toEqual({
      level: 'none',
    })
  })

  it('never echoes what was written in the support signal', async () => {
    const recorded = await checkIn(`${urgent}, de verdade`)
    const added = await addendum(recorded.id, 'quero me cortar')
    const page = await savePage(await newPage(), 'Não aguento mais, quero sumir')

    for (const { support } of [recorded, added, page]) {
      expect(Object.keys(support)).toEqual(['level'])
    }
    expect(page.support).toEqual({ level: 'watch' })
  })

  it('queues only the level and the ids for the professional alerts', async () => {
    await queue.take()
    const recorded = await checkIn(urgent)
    await checkIn(calm)

    const queued = await queue.take()
    expect(queued.map(({ trigger }) => trigger)).toEqual([
      {
        kind: 'note',
        note: { kind: 'check_in', patientId: marina.id, checkInId: recorded.id },
        level: 'urgent',
      },
    ])
    expect(queued[0]?.payload).not.toMatch(/morrer|suicide|signals/i)
  })

  it('logs only the level and the ids of a note that needs support', () => {
    const output = lines.join('\n')
    const signals = lines.filter((line) => line.includes('Note support signal'))

    expect(signals.length).toBeGreaterThan(0)
    for (const line of signals) {
      const logged = JSON.parse(line) as Record<string, unknown>
      expect(allowedKeys).toEqual(expect.arrayContaining(Object.keys(logged)))
      expect(['urgent', 'watch']).toContain(logged.support)
    }
    expect(output).not.toMatch(/morrer|triste|cortar|sumir|parque|suicide|self_harm|hopeless/i)
    expect(output).not.toContain(marina.email)
  })
})
