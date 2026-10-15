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

export function weekdayName(weekday: number, locale: Locale): string {
  const sunday = Date.UTC(2026, 9, 11, 12)
  const name = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(sunday + weekday * 24 * 60 * 60 * 1000),
  )
  return name.charAt(0).toUpperCase() + name.slice(1)
}
