import type { Locale, WeekdayMood } from '@mycogni/domain'

const mondayFirst: Readonly<Record<Locale, boolean>> = {
  'pt-BR': false,
  'en-US': false,
  'pt-PT': true,
  'en-GB': true,
}

export function weekOrder(weekdays: readonly WeekdayMood[], locale: Locale): WeekdayMood[] {
  return mondayFirst[locale] ? [...weekdays.slice(1), ...weekdays.slice(0, 1)] : [...weekdays]
}

function nameOf(weekday: number, locale: Locale, style: 'short' | 'long'): string {
  const sunday = Date.UTC(2026, 9, 11, 12)
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(
    new Date(sunday + weekday * 24 * 60 * 60 * 1000),
  )
}

export function weekdayName(weekday: number, locale: Locale): string {
  const name = nameOf(weekday, locale, 'short')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function weekdayLongName(weekday: number, locale: Locale): string {
  return nameOf(weekday, locale, 'long')
}

export interface WeekdayExtremes {
  best: number
  worst: number
}

export function weekdayExtremes(weekdays: readonly WeekdayMood[]): WeekdayExtremes | null {
  const recorded = weekdays.flatMap((day) =>
    day.average === null ? [] : [{ weekday: day.weekday, average: day.average }],
  )
  const [first, ...rest] = recorded
  if (first === undefined || rest.length === 0) {
    return null
  }
  const best = rest.reduce((top, day) => (day.average > top.average ? day : top), first)
  const worst = rest.reduce((low, day) => (day.average < low.average ? day : low), first)
  return best.average === worst.average ? null : { best: best.weekday, worst: worst.weekday }
}
