import { describe, expect, it } from '@jest/globals'
import { severities } from './instrument.ts'
import { plainLevelOf, plainLevelRank, plainLevels, plainTrendOf } from './plain.ts'

describe('plain levels', () => {
  it('folds the five clinical bands into four plain steps', () => {
    expect(severities.map(plainLevelOf)).toEqual(['low', 'mild', 'moderate', 'high', 'high'])
    expect(plainLevels.map(plainLevelRank)).toEqual([0, 1, 2, 3])
  })
})

describe('plainTrendOf', () => {
  it('compares the plain step with the previous answer', () => {
    expect(plainTrendOf('moderate', 'moderate')).toBe('same')
    expect(plainTrendOf('mild', 'moderate')).toBe('better')
    expect(plainTrendOf('moderate', 'minimal')).toBe('higher')
  })

  it('treats moving between the two highest bands as the same step', () => {
    expect(plainTrendOf('severe', 'moderately_severe')).toBe('same')
    expect(plainTrendOf('moderately_severe', 'severe')).toBe('same')
  })
})
