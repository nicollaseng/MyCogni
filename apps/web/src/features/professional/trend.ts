export type TrendDirection = 'up' | 'down' | 'steady'

export interface MoodTrend {
  delta: number
  direction: TrendDirection
}

const steadyMargin = 0.5

export function moodTrend(current: number | null, previous: number | null): MoodTrend | null {
  if (current === null || previous === null) {
    return null
  }
  const delta = Math.round((current - previous) * 10) / 10
  if (delta >= steadyMargin) {
    return { delta, direction: 'up' }
  }
  return { delta, direction: delta <= -steadyMargin ? 'down' : 'steady' }
}
