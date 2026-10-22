import { describe, expect, it } from '@jest/globals'
import { photoFromHash, photoHash } from './use-photo-hash'

describe('photo links', () => {
  it('points a page address at one of its photos and reads it back', () => {
    const path = 'user/entry/one photo.webp'

    expect(photoHash(path)).toBe('#photo=user%2Fentry%2Fone%20photo.webp')
    expect(photoFromHash(photoHash(path))).toBe(path)
  })

  it('ignores any other address', () => {
    expect(photoFromHash('')).toBeNull()
    expect(photoFromHash('#other')).toBeNull()
    expect(photoFromHash('#photo=%E0%A4%A')).toBeNull()
  })
})
