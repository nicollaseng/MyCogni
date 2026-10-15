import { averageOf, type MoodDay } from './days.ts'

export const moodChanges = [
  'higher',
  'slightlyHigher',
  'similar',
  'slightlyLower',
  'lower',
] as const

export type MoodChange = (typeof moodChanges)[number]

export interface WeekSummary {
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

export function weekSummary(days: readonly MoodDay[]): WeekSummary {
  const recentWeek = recordedAverages(days.slice(-weekLength))
  const previousWeek = recordedAverages(days.slice(-2 * weekLength, -weekLength))
  const recent = averageOf(recentWeek)
  const previous = averageOf(previousWeek)
  const comparable = recentWeek.length >= minComparedDays && previousWeek.length >= minComparedDays
  return {
    recent,
    recentDays: recentWeek.length,
    previous,
    change: comparable && recent !== null && previous !== null ? changeOf(recent - previous) : null,
  }
}
