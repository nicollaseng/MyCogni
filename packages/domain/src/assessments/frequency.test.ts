import { describe, expect, it } from '@jest/globals'
import { frequencyOptions, isAnswer } from './frequency.ts'

describe('frequency options', () => {
  it('offers the four answers of the official forms, scored from 0 to 3', () => {
    expect(frequencyOptions.map(({ value, label }) => `${String(value)} ${label}`)).toEqual([
      '0 Nenhuma vez',
      '1 Vários dias',
      '2 Mais da metade dos dias',
      '3 Quase todos os dias',
    ])
  })

  it.each([0, 1, 2, 3])('accepts %p as an answer', (value) => {
    expect(isAnswer(value)).toBe(true)
  })

  it.each([-1, 4, 1.5, Number.NaN, '1', null, undefined])('rejects %p as an answer', (value) => {
    expect(isAnswer(value)).toBe(false)
  })
})
