import type { DatedMood } from '../check-ins/days.ts'
import { averageOf, levelsByDay, meanOf, weekdayOf } from './days.ts'

export interface WeekdayMood {
  weekday: number
  average: number | null
  days: number
}

export function moodByWeekday(
  moods: readonly DatedMood[],
  { timeZone }: { timeZone: string },
): WeekdayMood[] {
  const averages: number[][] = Array.from({ length: 7 }, () => [])
  for (const [day, levels] of levelsByDay(moods, timeZone)) {
    averages[weekdayOf(day)]?.push(meanOf(levels))
  }
  return averages.map((values, weekday) => ({
    weekday,
    average: averageOf(values),
    days: values.length,
  }))
}
