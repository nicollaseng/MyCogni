import type { Assessment } from '@mycogni/contracts'
import type { Locale } from '@mycogni/domain'

export type Change = 'same' | 'up' | 'down'

export interface Comparison {
  change: Change
  points: number
  day: string
}

function changeOf(difference: number): Change {
  if (difference === 0) {
    return 'same'
  }
  return difference > 0 ? 'up' : 'down'
}

export function comparisonOf(
  current: Assessment,
  previous: Assessment,
  timeZone: string,
  locale: Locale,
): Comparison {
  const difference = current.totalScore - previous.totalScore
  return {
    change: changeOf(difference),
    points: Math.abs(difference),
    day: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone }).format(
      new Date(previous.completedAt),
    ),
  }
}
