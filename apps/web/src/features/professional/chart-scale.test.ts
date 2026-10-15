import { describe, expect, it } from '@jest/globals'
import {
  axisLabelIndices,
  bandCenter,
  indexAt,
  movedIndex,
  niceTicks,
  percentOf,
  segmentsOf,
  tooltipSide,
} from './chart-scale'

describe('niceTicks', () => {
  it('rounds the axis up to clean whole steps', () => {
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8])
    expect(niceTicks(12)).toEqual([0, 5, 10, 15])
    expect(niceTicks(23)).toEqual([0, 10, 20, 30])
    expect(niceTicks(1)).toEqual([0, 1])
  })

  it('keeps a readable axis when there is nothing to show', () => {
    expect(niceTicks(0)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('percentOf', () => {
  it('maps a value into the scale and clamps the ends', () => {
    expect(percentOf(3, 0, 6)).toBe(50)
    expect(percentOf(8, 0, 6)).toBe(100)
    expect(percentOf(-1, 0, 6)).toBe(0)
    expect(percentOf(2, 0, 0)).toBe(0)
  })
})

describe('bandCenter and indexAt', () => {
  it('places each day in the middle of its band and finds the day under the pointer', () => {
    expect(bandCenter(0, 4)).toBe(12.5)
    expect(bandCenter(3, 4)).toBe(87.5)
    expect(indexAt(0, 400, 4)).toBe(0)
    expect(indexAt(199, 400, 4)).toBe(1)
    expect(indexAt(400, 400, 4)).toBe(3)
    expect(indexAt(-20, 400, 4)).toBe(0)
  })
})

describe('segmentsOf', () => {
  it('breaks the line wherever a day has no value', () => {
    expect(segmentsOf([1, 2, null, 4, null, null, 5, 6])).toEqual([
      [
        { index: 0, value: 1 },
        { index: 1, value: 2 },
      ],
      [{ index: 3, value: 4 }],
      [
        { index: 6, value: 5 },
        { index: 7, value: 6 },
      ],
    ])
    expect(segmentsOf([null, null])).toEqual([])
  })
})

describe('axisLabelIndices', () => {
  it('labels every week counting back from today', () => {
    expect(axisLabelIndices(30, 7)).toEqual([1, 8, 15, 22, 29])
    expect(axisLabelIndices(3, 7)).toEqual([2])
  })
})

describe('tooltipSide', () => {
  it('opens the tooltip towards the side with more room', () => {
    expect(tooltipSide(0, 30)).toBe('right')
    expect(tooltipSide(15, 30)).toBe('right')
    expect(tooltipSide(17, 30)).toBe('left')
    expect(tooltipSide(29, 30)).toBe('left')
  })
})

describe('movedIndex', () => {
  it('walks the days with the arrow keys and jumps with Home and End', () => {
    expect(movedIndex(null, 'ArrowLeft', 30)).toBe(29)
    expect(movedIndex(10, 'ArrowLeft', 30)).toBe(9)
    expect(movedIndex(0, 'ArrowLeft', 30)).toBe(0)
    expect(movedIndex(29, 'ArrowRight', 30)).toBe(29)
    expect(movedIndex(5, 'Home', 30)).toBe(0)
    expect(movedIndex(5, 'End', 30)).toBe(29)
    expect(movedIndex(5, 'Enter', 30)).toBe(5)
  })
})
