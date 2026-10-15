import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { sendPhoto } from './photo-upload'

interface FakeResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

const original = Object.getOwnPropertyDescriptor(globalThis, 'fetch')

function answer(status: number, body: unknown) {
  const fetchMock = jest.fn<(input: string, init: RequestInit) => Promise<FakeResponse>>(() =>
    Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) }),
  )
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchMock })
}

const photo = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })

describe('sendPhoto', () => {
  afterEach(() => {
    if (original === undefined) {
      Reflect.deleteProperty(globalThis, 'fetch')
    } else {
      Object.defineProperty(globalThis, 'fetch', original)
    }
  })

  it('returns the link of the saved photo', async () => {
    answer(201, { url: 'https://storage.example/avatars/ana.jpg?token=1' })

    await expect(sendPhoto(photo)).resolves.toEqual({
      ok: true,
      value: 'https://storage.example/avatars/ana.jpg?token=1',
    })
  })

  it('accepts a saved photo whose link is not ready', async () => {
    answer(201, { url: null })

    await expect(sendPhoto(photo)).resolves.toEqual({ ok: true, value: null })
  })

  it('treats an unexpected answer as a failed upload', async () => {
    answer(201, { saved: true })

    await expect(sendPhoto(photo)).resolves.toEqual({ ok: false, problem: 'failed' })
  })

  it('explains a photo refused for its size', async () => {
    answer(413, { code: 'TOO_LARGE' })

    await expect(sendPhoto(photo)).resolves.toEqual({ ok: false, problem: 'size' })
  })
})
