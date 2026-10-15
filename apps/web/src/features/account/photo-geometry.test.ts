import { describe, expect, it } from '@jest/globals'
import { centeredSquare, quarterTurn, rotatedSize, usableArea } from './photo-geometry'

describe('photo geometry', () => {
  it('measures the box that holds a rotated photo', () => {
    expect(rotatedSize({ width: 400, height: 300 }, 0)).toEqual({ width: 400, height: 300 })
    const quarter = rotatedSize({ width: 400, height: 300 }, 90)
    expect(quarter.width).toBeCloseTo(300)
    expect(quarter.height).toBeCloseTo(400)
    const tilted = rotatedSize({ width: 100, height: 100 }, 45)
    expect(tilted.width).toBeCloseTo(141.42, 1)
  })

  it('falls back to the largest square in the middle of the photo', () => {
    expect(centeredSquare({ width: 400, height: 300 })).toEqual({
      x: 50,
      y: 0,
      width: 300,
      height: 300,
    })
  })

  it('turns the photo a quarter at a time in both directions', () => {
    expect(quarterTurn(0, 1)).toBe(90)
    expect(quarterTurn(0, -1)).toBe(270)
    expect(quarterTurn(270, 1)).toBe(0)
  })

  it('ignores a crop measured before the photo has loaded', () => {
    const area = { x: 10, y: 20, width: 300, height: 300 }

    expect(usableArea(area)).toBe(area)
    expect(usableArea({ x: Number.NaN, y: 0, width: 0, height: 0 })).toBeNull()
    expect(usableArea({ x: 0, y: 0, width: 0, height: 0 })).toBeNull()
  })
})
