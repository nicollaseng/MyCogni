import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { forgetMemory } from './forget'

type Fetch = (input: string, init: RequestInit) => Promise<{ ok: boolean }>

const original = Object.getOwnPropertyDescriptor(globalThis, 'fetch')

const memoryId = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'

function stubFetch(fetchMock: jest.Mock<Fetch>) {
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

describe('forgetMemory', () => {
  it('asks the page to delete the memory with a request that outlives it', async () => {
    const fetchMock = stubFetch(jest.fn<Fetch>().mockResolvedValue({ ok: true }))

    await expect(forgetMemory(memoryId)).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(`/me/memories/${memoryId}`, {
      method: 'DELETE',
      keepalive: true,
    })
  })

  it('says when the memory was not deleted', async () => {
    stubFetch(jest.fn<Fetch>().mockResolvedValue({ ok: false }))
    await expect(forgetMemory(memoryId)).resolves.toBe(false)

    stubFetch(jest.fn<Fetch>().mockRejectedValue(new TypeError('offline')))
    await expect(forgetMemory(memoryId)).resolves.toBe(false)
  })
})
