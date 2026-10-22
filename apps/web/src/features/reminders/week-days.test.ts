import { describe, expect, it } from '@jest/globals'
import { dayKeyOf, dayOrder, toggleDay } from './week-days'

describe('week days', () => {
  it('starts the week where each place usually does', () => {
    expect(dayOrder('pt-BR')).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(dayOrder('en-US')).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(dayOrder('pt-PT')).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(dayOrder('en-GB')).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it('names each day and toggles it in order', () => {
    expect([0, 3, 6].map(dayKeyOf)).toEqual(['sun', 'wed', 'sat'])
    expect(toggleDay([1, 5], 3)).toEqual([1, 3, 5])
    expect(toggleDay([1, 3, 5], 3)).toEqual([1, 5])
  })
})
