import { describe, expect, it } from '@jest/globals'
import type { CheckIn } from '@mycogni/contracts'
import { moodTrend } from './trend'

const timeZone = 'America/Sao_Paulo'
const now = new Date('2026-10-15T15:00:00Z')

function checkIn(daysAgo: number, moodLevel: number): CheckIn {
  return {
    id: `0b7c6c8e-6a8f-4f53-9f4b-${String(daysAgo * 10 + moodLevel).padStart(12, '0')}`,
    moodLevel,
    emotions: [],
    contexts: [],
    note: null,
    recordedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  }
}

describe('moodTrend', () => {
  it('has nothing to say without entries in the last 7 days', () => {
    expect(moodTrend([checkIn(9, 4)], { timeZone, now })).toBeNull()
  })

  it('averages the last 7 days without a comparison when the week before is empty', () => {
    expect(moodTrend([checkIn(0, 4), checkIn(2, 2)], { timeZone, now })).toEqual({
      recent: 3,
      previous: null,
      direction: null,
    })
  })

  it('compares the last 7 days with the 7 before', () => {
    const better = [checkIn(1, 5), checkIn(3, 5), checkIn(8, 2), checkIn(10, 3)]
    const worse = [checkIn(1, 2), checkIn(9, 4)]
    const steady = [checkIn(1, 3), checkIn(9, 3)]

    expect(moodTrend(better, { timeZone, now })).toEqual({
      recent: 5,
      previous: 2.5,
      direction: 'up',
    })
    expect(moodTrend(worse, { timeZone, now })?.direction).toBe('down')
    expect(moodTrend(steady, { timeZone, now })?.direction).toBe('steady')
  })

  it('weighs each day once even with several entries on it', () => {
    const trend = moodTrend([checkIn(0, 6), checkIn(0, 6), checkIn(0, 6), checkIn(1, 0)], {
      timeZone,
      now,
    })

    expect(trend?.recent).toBe(3)
  })
})
