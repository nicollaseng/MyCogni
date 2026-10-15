import { describe, expect, it } from '@jest/globals'
import { initialsOf } from './initials'

describe('initialsOf', () => {
  it('uses the first and last names and skips titles', () => {
    expect(initialsOf('Dra. Helena Duarte')).toBe('HD')
    expect(initialsOf('Dr. Rui Matos')).toBe('RM')
    expect(initialsOf('helena prado lima')).toBe('HL')
  })

  it('keeps a single name to one letter', () => {
    expect(initialsOf('Helena')).toBe('H')
    expect(initialsOf('  Dr.  ')).toBe('D')
  })

  it('falls back to the email when there is no name', () => {
    expect(initialsOf('Marina Alves Costa', 'm@exemplo.com')).toBe('MC')
    expect(initialsOf('  ', 'nicollas.linhares@exemplo.com')).toBe('NL')
    expect(initialsOf(null, 'ana@exemplo.com')).toBe('A')
    expect(initialsOf(null, null)).toBe('')
  })
})
