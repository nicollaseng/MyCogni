import { describe, expect, it } from '@jest/globals'
import { contourPath, ringOpacity, ringRadius } from './contour'

function irregularity(valence: number): number {
  const radii = Array.from({ length: 64 }, (_, index) =>
    ringRadius(6, (index / 64) * Math.PI * 2, { rings: 11, valence, time: 2 }),
  )
  return Math.max(...radii) - Math.min(...radii)
}

describe('contour map', () => {
  it('draws each ring as a closed shape', () => {
    const path = contourPath(3, { rings: 11, valence: 0.4, time: 1 })

    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
  })

  it('draws the same shape for the same mood and moment', () => {
    const options = { rings: 11, valence: 0.7, time: 3.5 }

    expect(contourPath(5, options)).toBe(contourPath(5, options))
  })

  it('makes difficult moods visibly more restless than good moods', () => {
    expect(irregularity(0)).toBeGreaterThan(irregularity(1) * 3)
  })

  it('spreads rings further apart on good days', () => {
    const outerRing = (valence: number) => ringRadius(10, 0, { rings: 11, valence, time: 0 })

    expect(outerRing(1)).toBeGreaterThan(outerRing(0))
  })

  it('can start from a wider centre with an even gap between rings', () => {
    const wide = { rings: 7, valence: 0.8, time: 0, base: 66, gap: 12 }
    const meanRadius = (ring: number) =>
      Array.from({ length: 64 }, (_, index) =>
        ringRadius(ring, (index / 64) * Math.PI * 2, wide),
      ).reduce((total, radius) => total + radius, 0) / 64

    expect(meanRadius(0)).toBeCloseTo(66, 6)
    expect(meanRadius(2) - meanRadius(1)).toBeCloseTo(12, 6)
  })

  it('fades the rings from the center outwards', () => {
    expect(ringOpacity(0, 11)).toBeGreaterThan(ringOpacity(10, 11))
  })
})
