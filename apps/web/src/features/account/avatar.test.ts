import { describe, expect, it } from '@jest/globals'
import { initialsOf } from './avatar'

describe('initialsOf', () => {
  it('uses the initials of the name, or of the email when there is no name', () => {
    expect(initialsOf('Marina Alves Costa', 'm@exemplo.com')).toBe('MA')
    expect(initialsOf('  ', 'nicollas.linhares@exemplo.com')).toBe('NL')
    expect(initialsOf(null, null)).toBe('')
  })
})
