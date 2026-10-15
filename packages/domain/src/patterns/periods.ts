import { dayKey, previousDays } from '../check-ins/days.ts'

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

export function withinDays<Item extends { recordedAt: Date }>(
  items: readonly Item[],
  { timeZone, today, days }: { timeZone: string; today: Date; days: number },
): Item[] {
  const keys = new Set(previousDays(dayKey(today, timeZone), days))
  return items.filter((item) => keys.has(dayKey(item.recordedAt, timeZone)))
}
