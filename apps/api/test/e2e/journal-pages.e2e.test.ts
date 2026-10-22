import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { sharingConsentVersion } from '@mycogni/domain'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { journalEntries } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

interface SummaryPage {
  items: { id: string; title: string | null }[]
  total: number
  page: number
  size: number
}

const hourInMs = 60 * 60 * 1000

function titleOf(index: number): string {
  return index % 2 === 0 ? `Maré ${String(index)}` : `Dia ${String(index)}`
}

describe('/v1/journal pages', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser
  let helena: TestUser
  let entryIds: string[]

  function call(user: TestUser, url: string, payload?: object) {
    return app.inject({
      method: payload === undefined ? 'GET' : 'POST',
      url,
      headers: bearer(user),
      ...(payload === undefined ? {} : { payload }),
    })
  }

  async function pageOf(user: TestUser, url: string): Promise<SummaryPage> {
    const response = await call(user, url)
    expect(response.statusCode).toBe(200)
    return response.json<SummaryPage>()
  }

  function titles(page: SummaryPage): (string | null)[] {
    return page.items.map((item) => item.title)
  }

  async function seed(user: TestUser, count: number, now: number): Promise<string[]> {
    const rows = await connection.db
      .insert(journalEntries)
      .values(
        Array.from({ length: count }, (_, index) => ({
          userId: user.id,
          title: titleOf(index + 1),
          plainText: titleOf(index + 1),
          updatedAt: new Date(now - (index + 1) * hourInMs),
        })),
      )
      .returning({ id: journalEntries.id })
    return rows.map((row) => row.id)
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
    helena = await createTestUser()
    await registerProfessional(connection.db, helena.id)
    const now = Date.now()
    entryIds = await seed(ana, 23, now)
    await seed(bruno, 6, now)
    const { invitation } = (
      await call(helena, '/v1/invitations', { channel: 'link', locale: 'pt-BR' })
    ).json<{ invitation: { code: string } }>()
    const claimed = (await call(ana, '/v1/invitations/claim', { code: invitation.code })).json<{
      id: string
    }>()
    const link = (
      await call(ana, `/v1/invitations/${claimed.id}/accept`, {
        sharesHistory: false,
        consentVersion: sharingConsentVersion,
      })
    ).json<{ id: string }>()
    await call(ana, '/v1/journal/shares', {
      careLinkId: link.id,
      scope: 'entries',
      entryIds: entryIds.slice(0, 7),
      expiresAt: null,
    })
  })

  afterAll(async () => {
    for (const user of [ana, bruno, helena]) {
      await deleteTestUser(user.id)
    }
    await app.close()
    await connection.close()
  })

  it('shows the first ten pages, newest first, with the total of the book', async () => {
    const first = await pageOf(ana, '/v1/journal')

    expect(first).toEqual(expect.objectContaining({ total: 23, page: 1, size: 10 }))
    expect(titles(first)).toEqual(Array.from({ length: 10 }, (_, index) => titleOf(index + 1)))
  })

  it('moves to the next pages and stops at the last one', async () => {
    const second = await pageOf(ana, '/v1/journal?page=2')
    const last = await pageOf(ana, '/v1/journal?page=3')

    expect(titles(second)).toEqual(Array.from({ length: 10 }, (_, index) => titleOf(index + 11)))
    expect(titles(last)).toEqual([titleOf(21), titleOf(22), titleOf(23)])
    expect(last).toEqual(expect.objectContaining({ total: 23, page: 3 }))
  })

  it('shows 25 at once when asked', async () => {
    const all = await pageOf(ana, '/v1/journal?size=25')

    expect(all.items).toHaveLength(23)
    expect(all).toEqual(expect.objectContaining({ total: 23, page: 1, size: 25 }))
  })

  it('answers a page past the end with the last page', async () => {
    const beyond = await pageOf(ana, '/v1/journal?page=9')
    const wide = await pageOf(ana, '/v1/journal?page=2&size=25')

    expect(beyond).toEqual(expect.objectContaining({ page: 3, total: 23 }))
    expect(titles(beyond)).toEqual([titleOf(21), titleOf(22), titleOf(23)])
    expect(wide).toEqual(expect.objectContaining({ page: 1, size: 25 }))
    expect(wide.items).toHaveLength(23)
  })

  it('counts and pages only what matches the search, in the own book', async () => {
    const first = await pageOf(ana, '/v1/journal?q=MAR%C3%89&size=10')
    const second = await pageOf(ana, '/v1/journal?q=mar%C3%A9&page=2')
    const none = await pageOf(ana, '/v1/journal?q=nada%20disso&page=4')

    expect(first.total).toBe(11)
    expect(titles(first)).toEqual(
      Array.from({ length: 10 }, (_, index) => titleOf((index + 1) * 2)),
    )
    expect(titles(second)).toEqual([titleOf(22)])
    expect(second).toEqual(expect.objectContaining({ total: 11, page: 2 }))
    expect(none).toEqual({ items: [], total: 0, page: 1, size: 10 })
  })

  it('counts for the professional only the pages that were shared', async () => {
    const first = await pageOf(helena, `/v1/professional/patients/${ana.id}/journal?size=10`)
    const second = await pageOf(helena, `/v1/professional/patients/${ana.id}/journal?size=5&page=2`)
    const searched = await pageOf(helena, `/v1/professional/patients/${ana.id}/journal?q=dia`)

    expect(first).toEqual(expect.objectContaining({ total: 7, page: 1, size: 10 }))
    expect(first.items.map((item) => item.id)).toEqual(entryIds.slice(0, 7))
    expect(titles(second)).toEqual([titleOf(6), titleOf(7)])
    expect(searched.total).toBe(4)
  })

  it('keeps the pages of others away from people without a link', async () => {
    const response = await call(bruno, `/v1/professional/patients/${ana.id}/journal`)
    const own = await pageOf(bruno, '/v1/journal?size=50')

    expect(response.statusCode).toBe(403)
    expect(own.total).toBe(6)
  })

  it.each([
    ['a page below one', 'page=0'],
    ['a page that is not a number', 'page=dois'],
    ['a fractional page', 'page=1.5'],
    ['a size above 100', 'size=101'],
    ['an empty size', 'size=0'],
  ])('rejects %s', async (_, query) => {
    const response = await call(ana, `/v1/journal?${query}`)

    expect(response.statusCode).toBe(400)
  })
})
