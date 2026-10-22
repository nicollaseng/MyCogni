import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { downloadPhoto, photoFileName } from './download'

const written = new Date('2026-10-19T02:30:00.000Z')

function serve(ok: boolean) {
  Object.assign(globalThis, {
    fetch: () =>
      Promise.resolve({ ok, blob: () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' })) }),
  })
}

describe('photoFileName', () => {
  it('names a photo after the day of the page, in the person time zone, and its position', () => {
    expect(photoFileName(written, 'America/Sao_Paulo', 2, 'u/e/abc.jpg')).toBe(
      'mybook-2026-10-18-2.jpg',
    )
    expect(photoFileName(written, 'Europe/Lisbon', 1, 'u/e/abc.webp')).toBe(
      'mybook-2026-10-19-1.webp',
    )
    expect(photoFileName(written, 'Europe/Lisbon', 3, 'u/e/abc', 'image/png')).toBe(
      'mybook-2026-10-19-3.png',
    )
  })
})

describe('downloadPhoto', () => {
  const clicks: string[] = []

  beforeEach(() => {
    serve(true)
    URL.createObjectURL = () => 'blob:photo'
    URL.revokeObjectURL = () => undefined
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this.download)
    })
  })

  afterEach(() => {
    clicks.splice(0)
    jest.restoreAllMocks()
    Reflect.deleteProperty(navigator, 'canShare')
    Reflect.deleteProperty(navigator, 'share')
    Reflect.deleteProperty(window, 'matchMedia')
  })

  it('saves the original with a download link on a computer', async () => {
    expect(
      await downloadPhoto('https://storage.local/a.jpg', () => 'mybook-2026-10-19-1.jpg'),
    ).toBe(true)
    expect(clicks).toEqual(['mybook-2026-10-19-1.jpg'])
  })

  it('hands the file to the share sheet on a phone that can share files', async () => {
    const share = jest.fn<(data: ShareData) => Promise<void>>(() => Promise.resolve())
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: true }),
    })

    expect(await downloadPhoto('https://storage.local/a.jpg', () => 'mybook-1.jpg')).toBe(true)

    expect(share.mock.calls[0]?.[0].files?.[0]?.name).toBe('mybook-1.jpg')
    expect(clicks).toEqual([])
  })

  it('reports a photo that could not be fetched', async () => {
    serve(false)

    expect(await downloadPhoto('https://storage.local/a.jpg', () => 'x.jpg')).toBe(false)
  })
})
