import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { Memory } from '@mycogni/contracts'
import { sharingConsentVersion } from '@mycogni/domain'
import { eq } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import {
  assistantMemories,
  assistantMemorySources,
  careLinks,
  checkIns,
} from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

describe('/v1/memories', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let helena: TestUser

  function call(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
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

  async function remember(user: TestUser, content: string, kind?: string): Promise<Memory> {
    const response = await call('POST', '/v1/memories', user, { content, kind })
    expect(response.statusCode).toBe(201)
    return response.json<Memory>()
  }

  async function list(user: TestUser): Promise<Memory[]> {
    const response = await call('GET', '/v1/memories', user)
    expect(response.statusCode).toBe(200)
    return response.json<Memory[]>()
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ full_name: 'Bruno Reis' })
    helena = await createTestUser({ full_name: 'Helena Prado' })
    await registerProfessional(connection.db, helena.id)
    await connection.db.insert(careLinks).values({
      professionalId: helena.id,
      patientId: ana.id,
      consentVersion: sharingConsentVersion,
      sharesHistory: true,
    })
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await deleteTestUser(helena.id)
    await app.close()
    await connection.close()
  })

  it('starts empty and is only for patients', async () => {
    expect(await list(ana)).toEqual([])
    const professional = await call('GET', '/v1/memories', helena)
    expect(professional.statusCode).toBe(403)
  })

  it('adds a memory the person writes, tidy and without sources', async () => {
    const memory = await remember(ana, '  Gosto de   ouvir jazz à noite. ')

    expect(memory).toEqual({
      id: expect.any(String),
      content: 'Gosto de ouvir jazz à noite.',
      kind: 'fact',
      origin: 'manual',
      importance: 3,
      status: 'active',
      sources: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  it('refuses an empty memory or one longer than 280 characters', async () => {
    expect((await call('POST', '/v1/memories', ana, { content: '   ' })).statusCode).toBe(400)
    expect((await call('POST', '/v1/memories', ana, { content: 'a'.repeat(281) })).statusCode).toBe(
      400,
    )
    expect(
      (await call('POST', '/v1/memories', ana, { content: 'Oi', kind: 'diagnosis' })).statusCode,
    ).toBe(400)
  })

  it('lists the newest first and edits the content or the kind', async () => {
    const goal = await remember(ana, 'Quero correr 5 km até dezembro.', 'goal')
    const [first] = await list(ana)
    expect(first?.id).toBe(goal.id)

    const edited = await call('PATCH', `/v1/memories/${goal.id}`, ana, {
      content: 'Quero correr 10 km até março.',
    })
    expect(edited.statusCode).toBe(200)
    expect(edited.json<Memory>()).toEqual(
      expect.objectContaining({ content: 'Quero correr 10 km até março.', kind: 'goal' }),
    )
    const rekinded = await call('PATCH', `/v1/memories/${goal.id}`, ana, { kind: 'routine' })
    expect(rekinded.json<Memory>().kind).toBe('routine')
    expect((await call('PATCH', `/v1/memories/${goal.id}`, ana, {})).statusCode).toBe(400)
  })

  it('keeps each memory to its owner, even from a linked professional', async () => {
    const [memory] = await list(ana)
    const id = memory?.id ?? ''

    expect(
      (await call('PATCH', `/v1/memories/${id}`, bruno, { content: 'Invadido.' })).statusCode,
    ).toBe(404)
    expect((await call('DELETE', `/v1/memories/${id}`, bruno)).statusCode).toBe(404)
    expect(await list(bruno)).toEqual([])
    const seenByHelena = await withUser(connection.db, helena.id, (tx) =>
      tx.select({ id: assistantMemories.id }).from(assistantMemories),
    )
    expect(seenByHelena).toEqual([])
    await expect(
      withUser(connection.db, helena.id, (tx) =>
        tx.insert(assistantMemories).values({
          userId: helena.id,
          content: 'Uma memória de profissional.',
          kind: 'fact',
          origin: 'manual',
        }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('refuses a source that belongs to someone else', async () => {
    const [brunosCheckIn] = await connection.db
      .insert(checkIns)
      .values({ userId: bruno.id, moodLevel: 3, note: 'nota do Bruno' })
      .returning({ id: checkIns.id })
    const [memory] = await list(ana)

    await expect(
      withUser(connection.db, ana.id, (tx) =>
        tx.insert(assistantMemorySources).values({
          memoryId: memory?.id ?? '',
          userId: ana.id,
          checkInId: brunosCheckIn?.id ?? null,
        }),
      ),
    ).rejects.toMatchObject({ cause: { code: '42501' } })
  })

  it('deletes one memory and then all of them', async () => {
    const memories = await list(ana)
    const [first] = memories

    expect((await call('DELETE', `/v1/memories/${first?.id ?? ''}`, ana)).statusCode).toBe(204)
    expect((await call('DELETE', `/v1/memories/${first?.id ?? ''}`, ana)).statusCode).toBe(404)
    expect(await list(ana)).toHaveLength(memories.length - 1)
    expect((await call('DELETE', '/v1/memories', ana)).statusCode).toBe(204)
    expect(await list(ana)).toEqual([])
    const left = await connection.db
      .select({ id: assistantMemories.id })
      .from(assistantMemories)
      .where(eq(assistantMemories.userId, ana.id))
    expect(left).toEqual([])
  })
})
