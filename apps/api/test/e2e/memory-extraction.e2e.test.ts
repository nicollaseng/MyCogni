import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { AccountExport, Memory } from '@mycogni/contracts'
import { eq } from 'drizzle-orm'
import { createScriptedMemoryExtractor } from '../../src/ai/scripted-memory-extractor.ts'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { assistantMemories, assistantMemorySources, checkIns } from '../../src/db/schema/index.ts'
import { createMemoryExtractionRepository } from '../../src/modules/memories/memory-extraction.repository.ts'
import { createMemoryJob, type MemoryJob } from '../../src/modules/memories/memory-job.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const document = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
})

describe('learning memories', () => {
  let app: App
  let connection: DatabaseConnection
  let job: MemoryJob
  const backlog: string[] = []
  const users: TestUser[] = []

  function call(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    url: string,
    user: TestUser,
    payload?: object,
  ) {
    return app.inject({
      method,
      url,
      headers: bearer(user),
      ...(payload === undefined ? {} : { payload }),
    })
  }

  async function person(locale = 'pt-BR'): Promise<TestUser> {
    const user = await createTestUser({ full_name: 'Marina Alves', locale })
    users.push(user)
    return user
  }

  async function note(user: TestUser, text: string): Promise<string> {
    const response = await call('POST', '/v1/check-ins', user, {
      moodLevel: 4,
      emotions: [],
      contexts: [],
      note: text,
    })
    expect(response.statusCode).toBe(201)
    return response.json<{ id: string }>().id
  }

  async function page(user: TestUser, text: string): Promise<string> {
    const created = await call('POST', '/v1/journal', user)
    const id = created.json<{ id: string }>().id
    const saved = await call('PUT', `/v1/journal/${id}`, user, {
      title: null,
      body: document(text),
      plainText: text,
      imagePaths: [],
    })
    expect(saved.statusCode).toBe(200)
    return id
  }

  async function allowJournal(user: TestUser): Promise<void> {
    const response = await call('POST', '/v1/consents', user, { kinds: ['assistant_journal'] })
    expect(response.statusCode).toBe(201)
  }

  async function memories(user: TestUser): Promise<Memory[]> {
    return (await call('GET', '/v1/memories', user)).json<Memory[]>()
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    job = createMemoryJob({
      memories: createMemoryExtractionRepository(connection.db),
      extractor: createScriptedMemoryExtractor(),
      backlog: (userId) => {
        backlog.push(userId)
        return Promise.resolve()
      },
      now: () => new Date(),
    })
  })

  afterAll(async () => {
    await Promise.all(users.map((user) => deleteTestUser(user.id)))
    await app.close()
    await connection.close()
  })

  it('learns from a check-in note and keeps where it came from', async () => {
    const marina = await person()
    await note(marina, 'Fiz uma caminhada depois do almoço e fiquei mais leve.')

    expect(await job.run(marina.id)).toEqual({ kind: 'applied', changes: 1, more: false })
    expect(await memories(marina)).toEqual([
      expect.objectContaining({
        content: 'Caminhar ajuda a se acalmar.',
        kind: 'coping',
        origin: 'extracted',
        sources: [{ kind: 'check_in', at: expect.any(String) }],
      }),
    ])
    expect(await job.run(marina.id)).toEqual({ kind: 'skipped', reason: 'nothing_new' })
  })

  it('merges what it already knows instead of repeating it', async () => {
    const marina = await person('en-US')
    await note(marina, 'A long walk this morning.')
    await job.run(marina.id)
    await note(marina, 'Another walk with my sister.')

    expect(await job.run(marina.id)).toEqual({ kind: 'applied', changes: 2, more: false })
    const learned = await memories(marina)
    expect(learned.map((memory) => memory.content).sort()).toEqual([
      'Their sister is an important source of support.',
      'Walking helps them calm down.',
    ])
    expect(learned.find((memory) => memory.kind === 'coping')?.sources).toHaveLength(2)
  })

  it('leaves crisis content out and reads MyBook only with permission', async () => {
    const marina = await person()
    await note(marina, 'Depois da caminhada pensei em me matar.')
    await page(marina, 'Durmo melhor quando desligo o celular cedo.')

    expect(await job.run(marina.id)).toEqual({ kind: 'applied', changes: 0, more: false })
    expect(await memories(marina)).toEqual([])

    await allowJournal(marina)
    await job.run(marina.id)
    expect(await memories(marina)).toEqual([
      expect.objectContaining({
        kind: 'routine',
        sources: [expect.objectContaining({ kind: 'journal' })],
      }),
    ])
  })

  it('learns nothing while memories are off, nor what was written meanwhile', async () => {
    const marina = await person()
    const off = await call('PATCH', '/v1/me', marina, { memoriesEnabled: false })
    expect(off.json()).toEqual(expect.objectContaining({ memoriesEnabled: false }))
    await note(marina, 'Uma caminhada longa no parque.')

    expect(await job.run(marina.id)).toEqual({ kind: 'skipped', reason: 'disabled' })
    await call('PATCH', '/v1/me', marina, { memoriesEnabled: true })
    expect(await job.run(marina.id)).toEqual({ kind: 'skipped', reason: 'nothing_new' })

    await note(marina, 'Minha irmã veio jantar.')
    expect(await job.run(marina.id)).toEqual({ kind: 'applied', changes: 1, more: false })
    expect((await memories(marina)).map((memory) => memory.kind)).toEqual(['relationship'])
  })

  it('forgets what was learned only from a deleted source and keeps the rest', async () => {
    const marina = await person()
    await allowJournal(marina)
    const pageId = await page(marina, 'Dormir cedo e caminhar me fazem bem.')
    await note(marina, 'Caminhei com calma hoje.')
    await job.run(marina.id)
    await call('POST', '/v1/memories', marina, { content: 'Gosto de chá de camomila.' })
    expect((await memories(marina)).map((memory) => memory.kind).sort()).toEqual([
      'coping',
      'fact',
      'routine',
    ])

    expect((await call('DELETE', `/v1/journal/${pageId}`, marina)).statusCode).toBe(204)

    const left = await memories(marina)
    expect(left.map((memory) => [memory.kind, memory.origin]).sort()).toEqual([
      ['coping', 'extracted'],
      ['fact', 'manual'],
    ])
    expect(left.find((memory) => memory.kind === 'coping')?.sources).toEqual([
      expect.objectContaining({ kind: 'check_in' }),
    ])
  })

  it('keeps a learned memory while another source still holds it', async () => {
    const marina = await person()
    const first = await note(marina, 'Uma caminhada curta.')
    await note(marina, 'Outra caminhada no fim do dia.')
    await job.run(marina.id)

    await connection.db.delete(checkIns).where(eq(checkIns.id, first))
    expect(await memories(marina)).toHaveLength(1)
    await connection.db.delete(checkIns).where(eq(checkIns.userId, marina.id))
    expect(await memories(marina)).toEqual([])
  })

  it('exports the memories and deletes them with the account', async () => {
    const marina = await person()
    await note(marina, 'Caminhada na praia.')
    await job.run(marina.id)
    await call('POST', '/v1/memories', marina, { content: 'Gosto de chá de camomila.' })

    const exported = await call('GET', '/v1/me/export', marina)
    expect(
      exported
        .json<AccountExport>()
        .memories.map((memory) => memory.origin)
        .sort(),
    ).toEqual(['extracted', 'manual'])
    expect((await call('DELETE', '/v1/me', marina)).statusCode).toBe(204)
    users.splice(users.indexOf(marina), 1)
    expect(
      await connection.db
        .select({ id: assistantMemories.id })
        .from(assistantMemories)
        .where(eq(assistantMemories.userId, marina.id)),
    ).toEqual([])
    expect(
      await connection.db
        .select({ id: assistantMemorySources.id })
        .from(assistantMemorySources)
        .where(eq(assistantMemorySources.userId, marina.id)),
    ).toEqual([])
  })

  it('stops at the batch size and asks for another run', async () => {
    const marina = await person()
    for (let index = 0; index < 31; index += 1) {
      await connection.db.insert(checkIns).values({
        userId: marina.id,
        moodLevel: 3,
        note: `Nota ${String(index)}`,
        recordedAt: new Date(Date.now() - (40 - index) * 60_000),
      })
    }

    expect(await job.run(marina.id)).toEqual({ kind: 'applied', changes: 0, more: true })
    expect(backlog).toContain(marina.id)
    expect(await job.run(marina.id)).toEqual({ kind: 'applied', changes: 0, more: false })
  })
})
