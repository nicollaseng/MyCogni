import { dayKey, previousDays, type DatedMood } from '../check-ins/days.ts'

export const patternPeriods = [7, 30, 90] as const

export type PatternPeriod = (typeof patternPeriods)[number]

export const defaultPatternPeriod: PatternPeriod = 30

const dayInMs = 24 * 60 * 60 * 1000

export function patternPeriodOf(value: string | undefined): PatternPeriod {
  return patternPeriods.find((period) => String(period) === value) ?? defaultPatternPeriod
}

export function historySince(period: PatternPeriod, now: Date): Date {
  return new Date(now.getTime() - (2 * period + 1) * dayInMs)
}

export function withinDays<Mood extends DatedMood>(
  moods: readonly Mood[],
  { timeZone, today, days }: { timeZone: string; today: Date; days: number },
): Mood[] {
  const keys = new Set(previousDays(dayKey(today, timeZone), days))
  return moods.filter((mood) => keys.has(dayKey(mood.recordedAt, timeZone)))
}
