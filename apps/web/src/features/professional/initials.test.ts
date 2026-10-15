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
})
