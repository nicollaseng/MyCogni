import { dayKey, previousDays, type DatedMood } from '../check-ins/days.ts'

export interface MoodDay {
  day: string
  average: number | null
  count: number
}

const dayInUtc = 24 * 60 * 60 * 1000

export function meanOf(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function averageOf(values: readonly number[]): number | null {
  return values.length === 0 ? null : meanOf(values)
}

export function dayBefore(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - dayInUtc).toISOString().slice(0, 10)
}

export function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay()
}

export function levelsByDay(moods: readonly DatedMood[], timeZone: string): Map<string, number[]> {
  const levels = new Map<string, number[]>()
  for (const mood of moods) {
    const key = dayKey(mood.recordedAt, timeZone)
    levels.set(key, [...(levels.get(key) ?? []), mood.moodLevel])
  }
  return levels
}

export function moodDays(
  moods: readonly DatedMood[],
  { timeZone, today, days }: { timeZone: string; today: Date; days: number },
): MoodDay[] {
  const levels = levelsByDay(moods, timeZone)
  return previousDays(dayKey(today, timeZone), days).map((day) => {
    const recorded = levels.get(day) ?? []
    return { day, average: averageOf(recorded), count: recorded.length }
  })
}
