import { averageOf, type MoodDay } from './days.ts'

export const moodChanges = [
  'higher',
  'slightlyHigher',
  'similar',
  'slightlyLower',
  'lower',
] as const

export type MoodChange = (typeof moodChanges)[number]

export interface PeriodSummary {
  recent: number | null
  recentDays: number
  previous: number | null
  change: MoodChange | null
}

const weekLength = 7
const minComparedDays = 2
const similarMargin = 0.25
const clearMargin = 0.75

function changeOf(difference: number): MoodChange {
  const size = Math.abs(difference)
  if (size < similarMargin) {
    return 'similar'
  }
  if (size < clearMargin) {
    return difference > 0 ? 'slightlyHigher' : 'slightlyLower'
  }
  return difference > 0 ? 'higher' : 'lower'
}

function recordedAverages(days: readonly MoodDay[]): number[] {
  return days.flatMap((day) => (day.average === null ? [] : [day.average]))
}

export function periodSummary(days: readonly MoodDay[], length: number): PeriodSummary {
  const recentPeriod = recordedAverages(days.slice(-length))
  const previousPeriod = recordedAverages(days.slice(-2 * length, -length))
  const recent = averageOf(recentPeriod)
  const previous = averageOf(previousPeriod)
  const comparable =
    recentPeriod.length >= minComparedDays && previousPeriod.length >= minComparedDays
  return {
    recent,
    recentDays: recentPeriod.length,
    previous,
    change: comparable && recent !== null && previous !== null ? changeOf(recent - previous) : null,
  }
}

export type WeekSummary = PeriodSummary

export function weekSummary(days: readonly MoodDay[]): WeekSummary {
  return periodSummary(days, weekLength)
}
