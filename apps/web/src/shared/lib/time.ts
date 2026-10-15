import type { Locale } from '@mycogni/domain'

export function formatLongDate(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(date)
}

export function formatDayTitle(date: Date, timeZone: string, locale: Locale): string {
  const formatted = formatLongDate(date, timeZone, locale)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatTime(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone }).format(
    date,
  )
}

export function formatDayMonth(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone }).format(date)
}

export function formatShortDate(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone }).format(date)
}

export function dateOfDay(day: string): Date {
  return new Date(`${day}T12:00:00Z`)
}
