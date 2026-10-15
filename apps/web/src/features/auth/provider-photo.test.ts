import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { importProviderPhoto } from './provider-photo'

type Send = (url: string, init: RequestInit) => Promise<Response>

function answer(status: number): Response {
  return { ok: status < 400, status } as Response
}

describe('importProviderPhoto', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env.API_URL = 'http://api.test'
    process.env.SITE_URL = 'http://web.test'
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    process.env = { ...env }
    jest.restoreAllMocks()
  })

  it('asks the API to import the photo of the person who just signed in', async () => {
    const send = jest.fn<Send>().mockResolvedValue(answer(200))

    await importProviderPhoto('token-123', send)

    expect(send).toHaveBeenCalledTimes(1)
    const [url, init] = send.mock.calls[0] ?? []
    expect(url).toBe('http://api.test/v1/me/photo/import')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({ authorization: 'Bearer token-123' })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(console.error).not.toHaveBeenCalled()
  })

  it('never fails the sign-in when the API refuses or cannot be reached', async () => {
    const refused = jest.fn<Send>().mockResolvedValue(answer(502))
    const unreachable = jest.fn<Send>().mockRejectedValue(new Error('timeout'))

    await expect(importProviderPhoto('token', refused)).resolves.toBeUndefined()
    await expect(importProviderPhoto('token', unreachable)).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledTimes(2)
  })
})
