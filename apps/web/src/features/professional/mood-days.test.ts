import { describe, expect, it } from '@jest/globals'
import type { CheckIn } from '@mycogni/contracts'
import { moodDays } from './mood-days'
import { testNow, testTimeZone } from './test-data'

function checkIn(recordedAt: string, moodLevel: number): CheckIn {
  return {
    id: '0b7c6c8e-6a8f-4f53-9f4b-000000000201',
    moodLevel,
    emotions: [],
    contexts: [],
    note: null,
    recordedAt,
  }
}

describe('moodDays', () => {
  it('averages each day in the professional time zone and leaves empty days blank', () => {
    const days = moodDays(
      [
        checkIn('2026-10-15T12:00:00Z', 4),
        checkIn('2026-10-15T14:00:00Z', 1),
        checkIn('2026-10-15T02:00:00Z', 6),
        checkIn('2026-10-13T12:00:00Z', 3),
      ],
      { timeZone: testTimeZone, now: testNow, days: 4 },
    )

    expect(days).toEqual([
      { day: '2026-10-12', average: null, count: 0 },
      { day: '2026-10-13', average: 3, count: 1 },
      { day: '2026-10-14', average: 6, count: 1 },
      { day: '2026-10-15', average: 2.5, count: 2 },
    ])
  })
})
