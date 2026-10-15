import { describe, expect, it } from '@jest/globals'
import { avatarExtension } from './avatar'

describe('avatar', () => {
  it('accepts only JPG, PNG and WebP photos', () => {
    expect(avatarExtension('image/jpeg')).toBe('jpg')
    expect(avatarExtension('image/webp')).toBe('webp')
    expect(avatarExtension('image/gif')).toBeNull()
  })
})
