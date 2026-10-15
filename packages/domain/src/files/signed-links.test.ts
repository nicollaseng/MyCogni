import { describe, expect, it } from '@jest/globals'
import { createSignedLinkCache, signedLinkWindow, signedLinkWindowSeconds } from './signed-links.ts'

const hour = 60 * 60

function at(time: string): Date {
  return new Date(`2026-10-15T${time}Z`)
}

function epoch(time: string): number {
  return at(time).getTime() / 1000
}

describe('signedLinkWindow', () => {
  it('gives every link signed within the same hour the same expiry', () => {
    const early = signedLinkWindow(at('14:00:00'))
    const late = signedLinkWindow(at('14:59:59.900'))

    expect(signedLinkWindowSeconds).toBe(hour)
    expect(early.expiresAt).toBe(epoch('16:00:00'))
    expect(late.expiresAt).toBe(early.expiresAt)
    expect(signedLinkWindow(at('15:00:00')).expiresAt).toBe(epoch('17:00:00'))
  })

  it('keeps each link valid for more than one hour after it is signed', () => {
    expect(signedLinkWindow(at('14:00:00')).expiresIn).toBe(2 * hour)
    expect(signedLinkWindow(at('14:59:59')).expiresIn).toBe(hour + 1)
    expect(signedLinkWindow(at('14:20:00'), 600).expiresIn).toBe(1200)
  })
})

describe('createSignedLinkCache', () => {
  const window = signedLinkWindow(at('14:10:00'))
  const next = signedLinkWindow(at('15:10:00'))

  it('returns the same link while the window lasts and forgets it afterwards', () => {
    const cache = createSignedLinkCache(10)
    cache.write('ana/photo.png', 'https://storage/ana?token=1', window)

    expect(cache.read('ana/photo.png', signedLinkWindow(at('14:50:00')))).toBe(
      'https://storage/ana?token=1',
    )
    expect(cache.read('ana/photo.png', next)).toBeUndefined()
    expect(cache.read('bia/photo.png', window)).toBeUndefined()
  })

  it('drops the oldest links once it is full', () => {
    const cache = createSignedLinkCache(2)
    cache.write('a', 'link-a', window)
    cache.write('b', 'link-b', window)
    cache.write('a', 'link-a2', window)
    cache.write('c', 'link-c', window)

    expect(cache.read('b', window)).toBeUndefined()
    expect(cache.read('a', window)).toBe('link-a2')
    expect(cache.read('c', window)).toBe('link-c')
  })
})
