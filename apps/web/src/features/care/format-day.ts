import type { Locale } from '@mycogni/domain'

export function formatDay(date: string, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone }).format(
    new Date(date),
  )
}
