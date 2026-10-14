import { describe, expect, it } from '@jest/globals'
import { isMoodLevel, labelOf, moodColor, moodLabels, valenceOf } from './mood-levels'

describe('mood levels', () => {
  it('names seven levels from the worst to the best', () => {
    expect(moodLabels).toHaveLength(7)
    expect(labelOf(0)).toBe('Muito mal')
    expect(labelOf(3)).toBe('Neutro')
    expect(labelOf(6)).toBe('Muito bem')
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
