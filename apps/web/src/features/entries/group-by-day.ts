import type { CheckIn } from '@mycogni/contracts'
import { dayKey, previousDays } from '@mycogni/domain'
import { formatLongDate } from '@/shared/lib/time'

export interface DayGroup {
  key: string
  label: string
  checkIns: CheckIn[]
}

function labelOf(key: string, today: string, recordedAt: Date, timeZone: string): string {
  if (key === today) {
    return 'Hoje'
  }
  if (key === previousDays(today, 2)[0]) {
    return 'Ontem'
  }
  return formatLongDate(recordedAt, timeZone)
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
      groups.push({ key, label: labelOf(key, today, recordedAt, timeZone), checkIns: [checkIn] })
    }
  }
  return groups
}
