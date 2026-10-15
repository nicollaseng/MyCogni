import { describe, expect, it } from '@jest/globals'
import { linePaths, moodTop, slotCenter } from './chart-geometry'

describe('chart geometry', () => {
  it('places the best mood at the top and the worst at the bottom of the plot', () => {
    expect(moodTop(6)).toBe('calc(8px + 0.0000 * (100% - 16px))')
    expect(moodTop(0)).toBe('calc(8px + 1.0000 * (100% - 16px))')
    expect(moodTop(4.5)).toBe('calc(8px + 0.2500 * (100% - 16px))')
  })

  it('centres each day in its own slot', () => {
    expect(slotCenter(0, 14)).toBe('3.5714%')
    expect(slotCenter(13, 14)).toBe('96.4286%')
  })

  it('joins only consecutive days and leaves gaps where there was no record', () => {
    expect(linePaths([3, 4, null, 5, null, 2, 2.5])).toEqual([
      'M0.50 3.00 L1.50 2.00',
      'M5.50 4.00 L6.50 3.50',
    ])
    expect(linePaths([null, 4, null])).toEqual([])
  })
})
