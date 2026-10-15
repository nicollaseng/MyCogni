import { describe, expect, it } from '@jest/globals'
import { dailyMoods, dayKey, previousDays } from './days.ts'

const saoPaulo = 'America/Sao_Paulo'

describe('dayKey', () => {
  it('names the day in the person time zone, not in UTC', () => {
    const lateNight = new Date('2026-10-15T01:30:00Z')

    expect(dayKey(lateNight, saoPaulo)).toBe('2026-10-14')
    expect(dayKey(lateNight, 'UTC')).toBe('2026-10-15')
  })
})

describe('previousDays', () => {
  it('lists the days ending today, oldest first, across month boundaries', () => {
    expect(previousDays('2026-11-02', 4)).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ])
  })
})

describe('dailyMoods', () => {
  const today = new Date('2026-10-14T15:00:00Z')

  it('leaves days without records empty', () => {
    expect(dailyMoods([], { timeZone: saoPaulo, today, days: 3 })).toEqual([null, null, null])
  })

  it('averages the records of each day and rounds to a level', () => {
    const moods = [
      { moodLevel: 1, recordedAt: new Date('2026-10-12T12:00:00Z') },
      { moodLevel: 4, recordedAt: new Date('2026-10-14T11:00:00Z') },
      { moodLevel: 5, recordedAt: new Date('2026-10-14T20:00:00Z') },
    ]

    expect(dailyMoods(moods, { timeZone: saoPaulo, today, days: 3 })).toEqual([1, null, 5])
  })

  it('counts a late night record on the local day', () => {
    const moods = [{ moodLevel: 2, recordedAt: new Date('2026-10-14T02:00:00Z') }]

    expect(dailyMoods(moods, { timeZone: saoPaulo, today, days: 2 })).toEqual([2, null])
  })

  it('ignores records older than the window', () => {
    const moods = [{ moodLevel: 6, recordedAt: new Date('2026-09-01T12:00:00Z') }]

    expect(dailyMoods(moods, { timeZone: saoPaulo, today, days: 2 })).toEqual([null, null])
  })
})
