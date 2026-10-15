import { describe, expect, it } from '@jest/globals'
import { crisisLinesFor } from './crisis-lines.ts'
import { locales } from './locales.ts'

describe('crisisLinesFor', () => {
  it('gives every locale dialable lines with a short name for compact help', () => {
    for (const locale of locales) {
      const lines = crisisLinesFor(locale)
      expect(lines.length).toBeGreaterThanOrEqual(2)
      for (const line of lines) {
        expect(line.phone).toMatch(/^\d{3,9}$/)
        expect(line.name.length).toBeGreaterThan(0)
        expect(line.name.length).toBeLessThanOrEqual(14)
      }
    }
    expect(crisisLinesFor('pt-BR').map((line) => `${line.display} ${line.name}`)).toEqual([
      '188 CVV',
      '192 SAMU',
    ])
  })
})
