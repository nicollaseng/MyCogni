import { describe, expect, it } from '@jest/globals'
import { gad7 } from '../assessments/gad7.ts'
import { phq9 } from '../assessments/phq9.ts'
import { consistencyOf } from './consistency.ts'
import { averageOf, dayBefore, moodDays, weekdayOf, type MoodDay } from './days.ts'
import { patternRules } from './rules.ts'
import { scoreTimeline, severityRanges } from './scores.ts'
import { contextEffects, frequentTags, notableEffects, type ContextEffect } from './tags.ts'
import { periodSummary, weekSummary } from './week.ts'
import { moodByWeekday } from './weekdays.ts'

const timeZone = 'America/Sao_Paulo'
const today = new Date('2026-10-14T15:00:00Z')

function at(day: string, hour = 15): Date {
  return new Date(`${day}T${String(hour).padStart(2, '0')}:00:00Z`)
}

function mood(day: string, moodLevel: number, contexts: readonly string[] = [], hour = 15) {
  return { moodLevel, recordedAt: at(day, hour), contexts }
}

function week(averages: readonly (number | null)[]): MoodDay[] {
  return averages.map((average, index) => ({
    day: `2026-10-${String(index + 1).padStart(2, '0')}`,
    average,
    count: average === null ? 0 : 1,
  }))
}

describe('day helpers', () => {
  it('averages a list and has no average without values', () => {
    expect(averageOf([2, 3, 5])).toBeCloseTo(10 / 3)
    expect(averageOf([])).toBeNull()
  })

  it('steps back one calendar day across months and tells the weekday', () => {
    expect(dayBefore('2026-11-01')).toBe('2026-10-31')
    expect(weekdayOf('2026-10-11')).toBe(0)
    expect(weekdayOf('2026-10-14')).toBe(3)
  })
})

describe('moodDays', () => {
  it('keeps the exact average and the number of records of each local day', () => {
    const days = moodDays(
      [
        mood('2026-10-12', 1),
        mood('2026-10-14', 4, [], 11),
        mood('2026-10-14', 5, [], 20),
        mood('2026-10-15', 6, [], 2),
      ],
      { timeZone, today, days: 3 },
    )

    expect(days).toEqual([
      { day: '2026-10-12', average: 1, count: 1 },
      { day: '2026-10-13', average: null, count: 0 },
      { day: '2026-10-14', average: 5, count: 3 },
    ])
  })
})

describe('weekSummary', () => {
  it('compares the last seven days with the seven before', () => {
    const summary = weekSummary(week([3, 3, null, 3, null, null, 3, 4, 4, null, 3.5, null, 4.5, 4]))

    expect(summary).toEqual({ recent: 4, recentDays: 5, previous: 3, change: 'higher' })
  })

  it.each([
    [[3, 3], [3.1, 3.2], 'similar'],
    [[3, 3], [3.5, 3.5], 'slightlyHigher'],
    [[3, 3], [2.5, 2.5], 'slightlyLower'],
    [[4, 4], [3, 3], 'lower'],
  ] as const)('calls %j followed by %j %s', (previous, recent, change) => {
    const days = week([
      ...previous,
      null,
      null,
      null,
      null,
      null,
      ...recent,
      null,
      null,
      null,
      null,
      null,
    ])

    expect(weekSummary(days).change).toBe(change)
  })

  it('does not compare when either week has fewer than two days', () => {
    expect(weekSummary(week([3, null, null, null, null, null, null, 4, 5]))).toEqual({
      recent: 4.5,
      recentDays: 2,
      previous: 3,
      change: null,
    })
    expect(weekSummary(week([null, null, null, null, null, null, null, 4]))).toEqual({
      recent: 4,
      recentDays: 1,
      previous: null,
      change: null,
    })
  })

  it('has no average for a week without records', () => {
    expect(weekSummary(week([2, 2, null, null, null, null, null]))).toEqual({
      recent: 2,
      recentDays: 2,
      previous: null,
      change: null,
    })
    expect(weekSummary([])).toEqual({ recent: null, recentDays: 0, previous: null, change: null })
  })
})

describe('periodSummary', () => {
  it('compares a period of any length with the one right before it', () => {
    const days = week([2, null, 3, 4, 4, 5])

    expect(periodSummary(days, 3)).toEqual({
      recent: 13 / 3,
      recentDays: 3,
      previous: 2.5,
      change: 'higher',
    })
    expect(periodSummary(days, 6)).toEqual({
      recent: 3.6,
      recentDays: 5,
      previous: null,
      change: null,
    })
  })
})

describe('moodByWeekday', () => {
  it('averages the daily averages of each weekday, Sunday first', () => {
    const weekdays = moodByWeekday(
      [
        mood('2026-10-11', 6),
        mood('2026-10-04', 2),
        mood('2026-10-04', 4),
        mood('2026-10-14', 1),
        mood('2026-10-15', 5, [], 2),
      ],
      { timeZone },
    )

    expect(weekdays).toHaveLength(7)
    expect(weekdays[0]).toEqual({ weekday: 0, average: 4.5, days: 2 })
    expect(weekdays[3]).toEqual({ weekday: 3, average: 3, days: 1 })
    expect(weekdays[1]).toEqual({ weekday: 1, average: null, days: 0 })
  })
})

describe('frequentTags', () => {
  it('ranks tags by the records that carry them, once per record', () => {
    expect(
      frequentTags(
        [['work', 'sleep', 'work'], ['sleep'], ['luto', 'sleep'], ['work'], ['family']],
        3,
      ),
    ).toEqual([
      { tag: 'sleep', count: 3 },
      { tag: 'work', count: 2 },
      { tag: 'family', count: 1 },
    ])
  })
})

describe('contextEffects', () => {
  const checkIns = [
    mood('2026-10-01', 5, ['exercise']),
    mood('2026-10-02', 4, ['exercise', 'work']),
    mood('2026-10-03', 2, ['work']),
    mood('2026-10-03', 4, ['exercise'], 22),
    mood('2026-10-04', 2, ['work']),
    mood('2026-10-05', 3, []),
    mood('2026-10-06', 1, ['work', 'sleep']),
  ]

  it('compares the average of days with and without each context', () => {
    const effects = contextEffects(checkIns, { timeZone, minDays: 2 })

    expect(effects.map((effect) => effect.context)).toEqual(['exercise', 'work'])
    expect(effects[0]).toEqual({
      context: 'exercise',
      withAverage: 4,
      withoutAverage: 2,
      withDays: 3,
      withoutDays: 3,
      difference: 2,
    })
    expect(effects[1]?.withAverage).toBeCloseTo(2.5)
    expect(effects[1]?.withoutAverage).toBe(4)
  })

  it('leaves out contexts without enough days on either side', () => {
    expect(
      contextEffects(checkIns, { timeZone, minDays: 3 }).map((effect) => effect.context),
    ).toEqual(['exercise'])
    expect(contextEffects(checkIns, { timeZone, minDays: 4 })).toEqual([])
  })

  it('orders ties by name', () => {
    const tied = [mood('2026-10-01', 4, ['b', 'a']), mood('2026-10-02', 2, [])]

    expect(contextEffects(tied, { timeZone, minDays: 1 }).map((effect) => effect.context)).toEqual([
      'a',
      'b',
    ])
  })
})

describe('notableEffects', () => {
  function effect(context: string, difference: number): ContextEffect {
    return {
      context,
      withAverage: 3 + difference,
      withoutAverage: 3,
      withDays: 5,
      withoutDays: 5,
      difference,
    }
  }

  it('keeps the largest differences either way, better days first', () => {
    const effects = [
      effect('exercise', 1.2),
      effect('friends', 0.4),
      effect('news', 0.1),
      effect('work', -0.9),
      effect('sleep', -0.35),
      effect('money', -0.2),
    ]

    expect(
      notableEffects(effects, { minDifference: 0.3, limit: 3 }).map((item) => item.context),
    ).toEqual(['exercise', 'friends', 'work'])
  })
})

describe('consistencyOf', () => {
  it('counts the days with a record in the window and the streak up to today', () => {
    const dates = ['2026-10-14', '2026-10-13', '2026-10-12', '2026-10-10', '2026-09-01'].map(
      (day) => at(day),
    )

    expect(consistencyOf(dates, { timeZone, today, days: 30 })).toEqual({
      recordedDays: 4,
      days: 30,
      currentStreak: 3,
    })
  })

  it('keeps the streak alive until the end of today', () => {
    const dates = [at('2026-10-13'), at('2026-10-12'), at('2026-10-13', 20)]

    expect(consistencyOf(dates, { timeZone, today, days: 7 }).currentStreak).toBe(2)
  })

  it('has no streak when yesterday had no record', () => {
    expect(consistencyOf([at('2026-10-11')], { timeZone, today, days: 7 })).toEqual({
      recordedDays: 1,
      days: 7,
      currentStreak: 0,
    })
  })
})

describe('scores', () => {
  it('turns the severity bands into closed score ranges', () => {
    expect(severityRanges(gad7)).toEqual([
      { severity: 'minimal', min: 0, max: 4 },
      { severity: 'mild', min: 5, max: 9 },
      { severity: 'moderate', min: 10, max: 14 },
      { severity: 'severe', min: 15, max: 21 },
    ])
    expect(severityRanges(phq9).at(-1)).toEqual({ severity: 'severe', min: 20, max: 27 })
  })

  it('keeps the scores of one questionnaire, oldest first', () => {
    const scores = [
      { id: 'c', instrument: 'phq9', totalScore: 8, completedAt: at('2026-10-10') },
      { id: 'b', instrument: 'gad7', totalScore: 6, completedAt: at('2026-10-01') },
      { id: 'a', instrument: 'phq9', totalScore: 12, completedAt: at('2026-09-20') },
    ] as const

    expect(scoreTimeline(scores, 'phq9').map((score) => score.id)).toEqual(['a', 'c'])
  })
})

describe('patternRules', () => {
  it('looks at ninety days and asks for two weeks before showing weekdays', () => {
    expect(patternRules.windowDays).toBe(90)
    expect(patternRules.minWeekdayDays).toBe(14)
  })
})
