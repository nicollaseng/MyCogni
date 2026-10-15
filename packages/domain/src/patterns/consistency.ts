import { dayKey, previousDays } from '../check-ins/days.ts'
import { dayBefore } from './days.ts'

export interface Consistency {
  recordedDays: number
  days: number
  currentStreak: number
}

export function consistencyOf(
  dates: readonly Date[],
  { timeZone, today, days }: { timeZone: string; today: Date; days: number },
): Consistency {
  const recorded = new Set(dates.map((date) => dayKey(date, timeZone)))
  const todayKey = dayKey(today, timeZone)
  let cursor = recorded.has(todayKey) ? todayKey : dayBefore(todayKey)
  let currentStreak = 0
  while (recorded.has(cursor)) {
    currentStreak += 1
    cursor = dayBefore(cursor)
  }
  return {
    recordedDays: previousDays(todayKey, days).filter((day) => recorded.has(day)).length,
    days,
    currentStreak,
  }
}
