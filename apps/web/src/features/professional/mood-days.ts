import type { CheckIn } from '@mycogni/contracts'
import { dayKey, previousDays } from '@mycogni/domain'

export interface MoodDay {
  day: string
  average: number | null
  count: number
}

export function moodDays(
  checkIns: readonly CheckIn[],
  { timeZone, now, days }: { timeZone: string; now: Date; days: number },
): MoodDay[] {
  const levels = new Map<string, number[]>()
  for (const checkIn of checkIns) {
    const key = dayKey(new Date(checkIn.recordedAt), timeZone)
    levels.set(key, [...(levels.get(key) ?? []), checkIn.moodLevel])
  }
  return previousDays(dayKey(now, timeZone), days).map((day) => {
    const recorded = levels.get(day) ?? []
    if (recorded.length === 0) {
      return { day, average: null, count: 0 }
    }
    const sum = recorded.reduce((total, level) => total + level, 0)
    return { day, average: Math.round((sum / recorded.length) * 10) / 10, count: recorded.length }
  })
}
