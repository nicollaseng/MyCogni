import { describe, expect, it } from '@jest/globals'
import {
  isMoodLevel,
  moodColor,
  moodKeyOf,
  moodKeys,
  nearestMoodKey,
  valenceOf,
} from './mood-levels'

describe('mood levels', () => {
  it('names seven levels from the worst to the best', () => {
    expect(moodKeys).toHaveLength(7)
    expect(moodKeyOf(0)).toBe('veryBad')
    expect(moodKeyOf(3)).toBe('neutral')
    expect(moodKeyOf(6)).toBe('veryGood')
  })

  it('names an average after the closest level, within the scale', () => {
    expect(nearestMoodKey(3.6)).toBe('slightlyGood')
    expect(nearestMoodKey(3.4)).toBe('neutral')
    expect(nearestMoodKey(-1)).toBe('veryBad')
    expect(nearestMoodKey(9)).toBe('veryGood')
  })

  it('places each level on a scale from 0 to 1', () => {
    expect(valenceOf(0)).toBe(0)
    expect(valenceOf(3)).toBe(0.5)
    expect(valenceOf(6)).toBe(1)
  })

  it('accepts only whole levels inside the scale', () => {
    expect(isMoodLevel(4)).toBe(true)
    expect(isMoodLevel(7)).toBe(false)
    expect(isMoodLevel(-1)).toBe(false)
    expect(isMoodLevel(2.5)).toBe(false)
  })

  it('goes from blue on difficult days to green on good days through a neutral gray', () => {
    expect(moodColor(0)).toBe('color-mix(in oklab, var(--mood-low) 100%, var(--mood-mid))')
    expect(moodColor(0.5)).toBe('color-mix(in oklab, var(--mood-low) 0%, var(--mood-mid))')
    expect(moodColor(1)).toBe('color-mix(in oklab, var(--mood-high) 100%, var(--mood-mid))')
  })
})
