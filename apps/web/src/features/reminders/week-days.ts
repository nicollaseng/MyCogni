import type { Locale } from '@mycogni/domain'

export const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export type DayKey = (typeof dayKeys)[number]

const mondayFirst: readonly number[] = [1, 2, 3, 4, 5, 6, 0]

const sundayFirst: readonly number[] = [0, 1, 2, 3, 4, 5, 6]

export function dayOrder(locale: Locale): readonly number[] {
  return locale === 'pt-PT' || locale === 'en-GB' ? mondayFirst : sundayFirst
}

export function dayKeyOf(day: number): DayKey {
  return dayKeys[day % dayKeys.length] ?? 'sun'
}

export function toggleDay(days: readonly number[], day: number): number[] {
  const next = days.includes(day) ? days.filter((entry) => entry !== day) : [...days, day]
  return next.sort((first, second) => first - second)
}
