import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import { checkIns } from '../../src/db/schema/index.ts'
import type { App } from '../../src/shared/http.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier } from '../support/test-app.ts'

interface CheckInPage {
  items: { note: string | null; moodLevel: number; recordedAt: string }[]
  total: number
  page: number
  size: number
}

const firstDay = Date.parse('2026-09-01T12:00:00Z')
const dayInMs = 24 * 60 * 60 * 1000

function noteOf(day: number): string {
  return `Dia ${String(day)}`
}

describe('/v1/check-ins/page', () => {
  let app: App
  let connection: DatabaseConnection
  let ana: TestUser
  let bruno: TestUser

  async function pageOf(user: TestUser, query: string): Promise<CheckInPage> {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/check-ins/page?${query}`,
      headers: bearer(user),
    })
    expect(response.statusCode).toBe(200)
    return response.json<CheckInPage>()
  }

  function notes(page: CheckInPage): (string | null)[] {
    return page.items.map((item) => item.note)
  }

  function days(from: number, to: number): string[] {
    return Array.from({ length: from - to + 1 }, (_, index) => noteOf(from - index))
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await app.ready()
    ana = await createTestUser()
    bruno = await createTestUser()
    await connection.db.insert(checkIns).values([
      ...Array.from({ length: 37 }, (_, index) => ({
        userId: ana.id,
        moodLevel: index % 2 === 0 ? 5 : 2,
        emotions: index % 3 === 0 ? ['anxiety'] : ['calm'],
        contexts: index % 2 === 0 ? ['work'] : ['family'],
        note: noteOf(index + 1),
        recordedAt: new Date(firstDay + index * dayInMs),
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        userId: bruno.id,
        moodLevel: 5,
        emotions: ['anxiety'],
        contexts: ['work'],
        note: noteOf(index + 1),
        recordedAt: new Date(firstDay + index * dayInMs),
      })),
    ])
  })

  afterAll(async () => {
    await deleteTestUser(ana.id)
    await deleteTestUser(bruno.id)
    await app.close()
    await connection.close()
  })

  it('shows ten records at a time, newest first, with the total', async () => {
    const first = await pageOf(ana, '')

    expect(first).toEqual(expect.objectContaining({ total: 37, page: 1, size: 10 }))
    expect(notes(first)).toEqual(days(37, 28))
  })

  it('walks through the pages and answers a page past the end with the last one', async () => {
    const third = await pageOf(ana, 'page=3')
    const last = await pageOf(ana, 'page=4')
    const beyond = await pageOf(ana, 'page=40')

    expect(notes(third)).toEqual(days(17, 8))
    expect(notes(last)).toEqual(days(7, 1))
    expect(beyond).toEqual(expect.objectContaining({ page: 4, total: 37 }))
    expect(notes(beyond)).toEqual(days(7, 1))
  })

  it('pages by 25, 50 and 100', async () => {
    const second = await pageOf(ana, 'size=25&page=2')
    const fifty = await pageOf(ana, 'size=50&page=3')
    const hundred = await pageOf(ana, 'size=100')

    expect(second).toEqual(expect.objectContaining({ total: 37, page: 2, size: 25 }))
    expect(notes(second)).toEqual(days(12, 1))
    expect(fifty).toEqual(expect.objectContaining({ page: 1, size: 50 }))
    expect(fifty.items).toHaveLength(37)
    expect(hundred.items).toHaveLength(37)
  })

  it('counts and pages only the records that match every filter', async () => {
    const anxious = await pageOf(ana, 'emotions=anxiety&page=2')
    const combined = await pageOf(ana, 'contexts=work&minMood=4&emotions=anxiety')
    const searched = await pageOf(ana, 'q=dia%203&size=10')
    const recent = await pageOf(
      ana,
      `since=${new Date(firstDay + 30 * dayInMs).toISOString()}&hasNote=true`,
    )

    expect(anxious).toEqual(expect.objectContaining({ total: 13, page: 2 }))
    expect(notes(anxious)).toEqual(['Dia 7', 'Dia 4', 'Dia 1'])
    expect(combined.total).toBe(7)
    expect(notes(combined)).toEqual([
      'Dia 37',
      'Dia 31',
      'Dia 25',
      'Dia 19',
      'Dia 13',
      'Dia 7',
      'Dia 1',
    ])
    expect(searched.total).toBe(9)
    expect(notes(searched)).toEqual([
      'Dia 37',
      'Dia 36',
      'Dia 35',
      'Dia 34',
      'Dia 33',
      'Dia 32',
      'Dia 31',
      'Dia 30',
      'Dia 3',
    ])
    expect(recent).toEqual(expect.objectContaining({ total: 7, page: 1 }))
  })

  it('answers an empty first page when nothing matches', async () => {
    expect(await pageOf(ana, 'contexts=sleep&page=3')).toEqual({
      items: [],
      total: 0,
      page: 1,
      size: 10,
    })
  })

  it('keeps every page to the own records', async () => {
    const own = await pageOf(bruno, 'size=25')

    expect(own.total).toBe(4)
    expect(notes(own)).toEqual(days(4, 1))
  })

  it('refuses to list without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/check-ins/page' })

    expect(response.statusCode).toBe(401)
  })

  it.each([
    ['a page below one', 'page=0'],
    ['a fractional page', 'page=2.5'],
    ['a size above 100', 'size=200'],
    ['a size that is not a number', 'size=dez'],
    ['a mood above the scale', 'minMood=7'],
  ])('rejects %s', async (_, query) => {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/check-ins/page?${query}`,
      headers: bearer(ana),
    })

    expect(response.statusCode).toBe(400)
  })
})
