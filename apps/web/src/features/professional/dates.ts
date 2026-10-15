import { dayKey, type Locale } from '@mycogni/domain'

const dayInMs = 24 * 60 * 60 * 1000

export function formatDate(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone }).format(date)
}

export function formatShortDate(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(date)
}

export function formatDateTime(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

export function daysAgo(date: Date, now: Date, timeZone: string): number {
  const then = Date.parse(`${dayKey(date, timeZone)}T00:00:00Z`)
  const today = Date.parse(`${dayKey(now, timeZone)}T00:00:00Z`)
  return Math.max(0, Math.round((today - then) / dayInMs))
}
