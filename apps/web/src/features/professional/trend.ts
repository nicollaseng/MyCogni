import type { CheckIn } from '@mycogni/contracts'
import { dailyMoods } from '@mycogni/domain'

export type TrendDirection = 'up' | 'down' | 'steady'

export interface MoodTrend {
  recent: number
  previous: number | null
  direction: TrendDirection | null
}

const weekDays = 7
const steadyMargin = 0.5

function averageOf(levels: readonly (number | null)[]): number | null {
  const recorded = levels.filter((level) => level !== null)
  if (recorded.length === 0) {
    return null
  }
  return recorded.reduce((sum, level) => sum + level, 0) / recorded.length
}

function directionOf(recent: number, previous: number): TrendDirection {
  const difference = recent - previous
  if (difference >= steadyMargin) {
    return 'up'
  }
  return difference <= -steadyMargin ? 'down' : 'steady'
}

export function moodTrend(
  checkIns: readonly CheckIn[],
  { timeZone, now }: { timeZone: string; now: Date },
): MoodTrend | null {
  const days = dailyMoods(
    checkIns.map((checkIn) => ({
      moodLevel: checkIn.moodLevel,
      recordedAt: new Date(checkIn.recordedAt),
    })),
    { timeZone, today: now, days: weekDays * 2 },
  )
  const recent = averageOf(days.slice(weekDays))
  if (recent === null) {
    return null
  }
  const previous = averageOf(days.slice(0, weekDays))
  return {
    recent,
    previous,
    direction: previous === null ? null : directionOf(recent, previous),
  }
}
