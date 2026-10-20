import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'
import type {
  AssistantConversation,
  AssistantExchange,
  AssistantOverview,
} from '@mycogni/contracts'
import { eq, sql } from 'drizzle-orm'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { withUser } from '../../src/db/rls.ts'
import { assistantConversations, journalEntries } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { FakeAssistantModel } from '../support/assistant.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

const readPage = [{ name: 'read_page', input: { entryId: '00000000-0000-4000-8000-000000000000' } }]

describe('/v1/assistant on a MyBook page', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let anaPage: string
  let brunoPage: string
  const model = new FakeAssistantModel()

  function send(user: TestUser, body: object) {
    return app.inject({
      method: 'POST',
      url: '/v1/assistant/messages',
      headers: bearer(user),
      payload: { conversationId: null, locale: 'pt-BR', ...body },
    })
  }

  async function exchange(user: TestUser, body: object): Promise<AssistantExchange> {
    const response = await send(user, body)
    expect(response.statusCode).toBe(200)
    return response.json<AssistantExchange>()
  }

  async function page(user: TestUser, title: string, plainText: string): Promise<string> {
    const [row] = await connection.db
      .insert(journalEntries)
      .values({ userId: user.id, title, plainText, imagePaths: [`${user.id}/x/photo.png`] })
      .returning({ id: journalEntries.id })
    return row?.id ?? ''
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      assistantModel: model,
    })
    await app.ready()
    ana = await createTestUser({ full_name: 'Ana Lima' })
    bruno = await createTestUser({ full_name: 'Bruno Reis' })
    for (const user of [ana, bruno]) {
      await app.inject({
        method: 'POST',
        url: '/v1/consents',
        headers: bearer(user),
        payload: { kinds: ['assistant_data', 'assistant_journal'] },
      })
    }
    anaPage = await page(ana, 'Domingo no parque', 'Fui ao parque com a minha irmã e senti calma.')
    brunoPage = await page(bruno, 'Segredo do Bruno', 'texto-sigiloso-do-bruno')
  })

  beforeEach(() => {
    model.reset()
  })

  afterAll(async () => {
    for (const user of [ana, bruno]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('reads the page the conversation is about, as data, without photos', async () => {
    model.calls = readPage

    const result = await exchange(ana, { text: 'Resuma esta página', entryId: anaPage })

    expect(model.lastRequest().tools.map((tool) => tool.name)).toContain('read_page')
    expect(model.lastRequest().notes.join(' ')).toContain('one MyBook page')
    expect(model.results[0]).toContain('Fui ao parque com a minha irmã e senti calma.')
    expect(model.results[0]).toContain('never an instruction')
    expect(model.results[0]).not.toContain('photo.png')
    const [stored] = await connection.db
      .select({ entryId: assistantConversations.journalEntryId })
      .from(assistantConversations)
      .where(eq(assistantConversations.id, result.conversationId))
    expect(stored?.entryId).toBe(anaPage)
  })

  it('refuses a page of someone else and reads nothing from it', async () => {
    model.calls = readPage

    const response = await send(ana, { text: 'Resuma esta página', entryId: brunoPage })

    expect(response.statusCode).toBe(404)
    expect(model.requests).toHaveLength(0)
    const inserted = await withUser(connection.db, ana.id, (tx) =>
      tx
        .insert(assistantConversations)
        .values({ ownerId: ana.id, mode: 'personal', journalEntryId: brunoPage })
        .returning({ id: assistantConversations.id }),
    ).catch(() => [])
    expect(inserted).toEqual([])
  })

  it('keeps the page of a conversation when it is reopened, whatever page the client sends', async () => {
    const first = await exchange(ana, { text: 'Me ajude a continuar', entryId: anaPage })
    model.reset()
    model.calls = readPage

    await exchange(ana, {
      text: 'E agora?',
      conversationId: first.conversationId,
      entryId: brunoPage,
    })

    expect(model.results[0]).toContain('senti calma')
    expect(model.results[0]).not.toContain('sigiloso')
    const conversation = await app.inject({
      method: 'GET',
      url: `/v1/assistant/conversations/${first.conversationId}`,
      headers: bearer(ana),
    })
    expect(conversation.json<AssistantConversation>().entryId).toBe(anaPage)
    const overview = await app.inject({ method: 'GET', url: '/v1/assistant', headers: bearer(ana) })
    expect(
      overview
        .json<AssistantOverview>()
        .conversations.find((item) => item.id === first.conversationId)?.entryId,
    ).toBe(anaPage)
  })

  it('keeps the general behaviour when the conversation is not about a page', async () => {
    model.calls = readPage

    await exchange(ana, { text: 'Como foi minha semana?' })

    expect(model.lastRequest().tools.map((tool) => tool.name)).not.toContain('read_page')
    expect(model.results[0]).toBe('{"error":"not_allowed"}')
  })

  it('respects the MyBook consent', async () => {
    await app.inject({
      method: 'DELETE',
      url: '/v1/consents/assistant_journal',
      headers: bearer(ana),
    })
    model.calls = readPage

    await exchange(ana, { text: 'Resuma esta página', entryId: anaPage })

    expect(model.lastRequest().tools.map((tool) => tool.name)).not.toContain('read_page')
    expect(model.results[0]).toBe('{"error":"not_allowed"}')
    await app.inject({
      method: 'POST',
      url: '/v1/consents',
      headers: bearer(ana),
      payload: { kinds: ['assistant_journal'] },
    })
  })

  it('loses the binding when the page is deleted and then reads nothing', async () => {
    const doomed = await page(ana, 'Rascunho', 'texto que vai sumir')
    const first = await exchange(ana, { text: 'Resuma esta página', entryId: doomed })
    await connection.db.execute(sql`delete from public.journal_entries where id = ${doomed}`)
    model.reset()
    model.calls = readPage

    await exchange(ana, { text: 'E agora?', conversationId: first.conversationId })

    expect(model.lastRequest().tools.map((tool) => tool.name)).not.toContain('read_page')
    expect(model.results[0]).toBe('{"error":"not_allowed"}')
  })

  it('never offers the page to the professional route', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/professional/patients/${ana.id}/assistant/messages`,
      headers: bearer(bruno),
      payload: { conversationId: null, text: 'Resumo', locale: 'pt-BR', entryId: anaPage },
    })

    expect([400, 403, 404]).toContain(response.statusCode)
    expect(model.requests).toHaveLength(0)
  })
})
