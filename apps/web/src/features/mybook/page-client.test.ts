import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { browserPageClient, pageClientHeader, pageClientVersion } from './page-client'

interface FakeResponse {
  status: number
  ok: boolean
  json: () => Promise<unknown>
}

type Fetch = (input: string, init: RequestInit) => Promise<FakeResponse>

const original = Object.getOwnPropertyDescriptor(globalThis, 'fetch')

const entryId = '8a7d3c1e-0000-4000-8000-000000000001'

const input = {
  title: 'Domingo',
  body: { type: 'doc', content: [] },
  plainText: '',
  imagePaths: [],
}

function answer(status: number, payload: unknown = null): FakeResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () =>
      payload === null ? Promise.reject(new SyntaxError('Not JSON')) : Promise.resolve(payload),
  }
}

function respond(...responses: FakeResponse[]) {
  const fetchMock = jest.fn<Fetch>()
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response)
  }
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchMock })
  return fetchMock
}

afterEach(() => {
  if (original === undefined) {
    Reflect.deleteProperty(globalThis, 'fetch')
  } else {
    Object.defineProperty(globalThis, 'fetch', original)
  }
})

describe('browserPageClient.save', () => {
  it('sends the page to its stable address and returns when the server saved it', async () => {
    const fetchMock = respond(answer(200, { updatedAt: '2026-10-15T15:00:00.000Z', safety: null }))

    expect(await browserPageClient.save(entryId, input)).toEqual({
      kind: 'saved',
      updatedAt: '2026-10-15T15:00:00.000Z',
      safety: null,
    })
    const [path, init] = fetchMock.mock.calls[0] ?? []
    expect(path).toBe(`/mybook/${entryId}/content`)
    expect(init).toMatchObject({
      method: 'PUT',
      body: JSON.stringify(input),
      headers: { [pageClientHeader]: pageClientVersion, 'content-type': 'application/json' },
    })
  })

  it('passes on the support the server offers after a save', async () => {
    const safety = { professionals: ['Helena Prado'] }
    respond(answer(200, { updatedAt: '2026-10-15T15:00:00.000Z', safety }))

    expect(await browserPageClient.save(entryId, input)).toEqual({
      kind: 'saved',
      updatedAt: '2026-10-15T15:00:00.000Z',
      safety,
    })
  })

  it('tells an updated app apart from a failure worth retrying', async () => {
    respond(
      answer(409, { code: 'OUTDATED_CLIENT' }),
      answer(404),
      answer(405),
      answer(404, { code: 'NOT_FOUND' }),
      answer(502, { code: 'API_FAILED' }),
      answer(200, { saved: true }),
    )

    const outcomes = []
    for (let attempt = 0; attempt < 6; attempt += 1) {
      outcomes.push((await browserPageClient.save(entryId, input)).kind)
    }

    expect(outcomes).toEqual(['outdated', 'outdated', 'outdated', 'failed', 'failed', 'failed'])
  })

  it('treats a request that never reached the server as a failure', async () => {
    const fetchMock = respond()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    expect(await browserPageClient.save(entryId, input)).toEqual({ kind: 'failed' })
  })
})

describe('browserPageClient.create and remove', () => {
  it('creates a page and returns its id', async () => {
    const fetchMock = respond(
      answer(201, { id: entryId }),
      answer(409, { code: 'OUTDATED_CLIENT' }),
    )

    expect(await browserPageClient.create()).toEqual({ kind: 'created', id: entryId })
    expect(await browserPageClient.create()).toEqual({ kind: 'outdated' })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/mybook/entries')
  })

  it('counts a page that is already gone as removed', async () => {
    respond(answer(204), answer(404, { code: 'NOT_FOUND' }), answer(404), answer(500))

    expect(await browserPageClient.remove(entryId)).toBe('removed')
    expect(await browserPageClient.remove(entryId)).toBe('removed')
    expect(await browserPageClient.remove(entryId)).toBe('outdated')
    expect(await browserPageClient.remove(entryId)).toBe('failed')
  })
})
