import { describe, expect, it } from '@jest/globals'
import { exerciseMs, momentAt, pointAt, sideOf } from './breathing'

describe('box breathing', () => {
  it('lasts four rounds of four phases of four seconds', () => {
    expect(exerciseMs).toBe(64_000)
  })

  it.each([
    [0, 'inhale', 4, 1],
    [999, 'inhale', 4, 1],
    [1000, 'inhale', 3, 1],
    [3999, 'inhale', 1, 1],
    [4000, 'holdIn', 4, 1],
    [8000, 'exhale', 4, 1],
    [12_000, 'holdOut', 4, 1],
    [16_000, 'inhale', 4, 2],
    [63_999, 'holdOut', 1, 4],
    [90_000, 'holdOut', 1, 4],
  ])('at %p ms says %p with %p left in round %p', (elapsed, phase, count, round) => {
    expect(momentAt(elapsed)).toMatchObject({ phase, count, round })
  })

  it('walks the dot up, across, down and back along the square', () => {
    expect(pointAt(momentAt(0))).toEqual({ x: 0, y: 100 })
    expect(pointAt(momentAt(2000))).toEqual({ x: 0, y: 50 })
    expect(pointAt(momentAt(6000))).toEqual({ x: 50, y: 0 })
    expect(pointAt(momentAt(10_000))).toEqual({ x: 100, y: 50 })
    expect(pointAt(momentAt(14_000))).toEqual({ x: 50, y: 100 })
    expect(sideOf(3)).toEqual({ from: { x: 100, y: 100 }, to: { x: 0, y: 100 } })
  })
})
