import { describe, expect, it } from '@jest/globals'
import { defaultPatternPeriod, historySince, patternPeriodOf, withinDays } from './periods.ts'

const timeZone = 'America/Sao_Paulo'
const today = new Date('2026-10-14T15:00:00Z')

describe('patternPeriodOf', () => {
  it('accepts the offered periods and falls back to 30 days', () => {
    expect(patternPeriodOf('7')).toBe(7)
    expect(patternPeriodOf('90')).toBe(90)
    expect(patternPeriodOf('14')).toBe(defaultPatternPeriod)
    expect(patternPeriodOf(undefined)).toBe(30)
  })
})

describe('historySince', () => {
  it('reaches back two periods and one spare day to compare with the previous period', () => {
    expect(historySince(7, today).toISOString()).toBe('2026-09-29T15:00:00.000Z')
  })
})

describe('withinDays', () => {
  it('keeps the records of the last local days, today included', () => {
    const moods = [
      { moodLevel: 1, recordedAt: new Date('2026-10-12T02:00:00Z') },
      { moodLevel: 2, recordedAt: new Date('2026-10-12T04:00:00Z') },
      { moodLevel: 3, recordedAt: new Date('2026-10-15T01:00:00Z') },
    ]

    expect(withinDays(moods, { timeZone, today, days: 3 }).map((mood) => mood.moodLevel)).toEqual([
      2, 3,
    ])
  })
})
