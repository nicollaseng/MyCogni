import { describe, expect, it } from '@jest/globals'
import { avatarExtension, initialsOf } from './avatar'

describe('avatar', () => {
  it('accepts only JPG, PNG and WebP photos', () => {
    expect(avatarExtension('image/jpeg')).toBe('jpg')
    expect(avatarExtension('image/webp')).toBe('webp')
    expect(avatarExtension('image/gif')).toBeNull()
  })

  it('uses the initials of the name, or of the email when there is no name', () => {
    expect(initialsOf('Marina Alves Costa', 'm@exemplo.com')).toBe('MA')
    expect(initialsOf('  ', 'nicollas.linhares@exemplo.com')).toBe('NL')
    expect(initialsOf(null, null)).toBe('')
  })
})
