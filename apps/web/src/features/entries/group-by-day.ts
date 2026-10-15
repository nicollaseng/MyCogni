import type { CheckIn } from '@mycogni/contracts'
import { dayKey, previousDays } from '@mycogni/domain'

export type RelativeDay = 'today' | 'yesterday' | 'earlier'

export interface DayGroup {
  key: string
  day: RelativeDay
  date: Date
  checkIns: CheckIn[]
}

function relativeDayOf(key: string, today: string): RelativeDay {
  if (key === today) {
    return 'today'
  }
  if (key === previousDays(today, 2)[0]) {
    return 'yesterday'
  }
  return 'earlier'
}

export function groupByDay(
  checkIns: readonly CheckIn[],
  { timeZone, now }: { timeZone: string; now: Date },
): DayGroup[] {
  const today = dayKey(now, timeZone)
  const groups: DayGroup[] = []
  for (const checkIn of checkIns) {
    const recordedAt = new Date(checkIn.recordedAt)
    const key = dayKey(recordedAt, timeZone)
    const last = groups.at(-1)
    if (last?.key === key) {
      last.checkIns.push(checkIn)
    } else {
      groups.push({
        key,
        day: relativeDayOf(key, today),
        date: recordedAt,
        checkIns: [checkIn],
      })
    }
  }
  return groups
}
