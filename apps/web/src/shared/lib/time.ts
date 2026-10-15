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

const minuteInMs = 60 * 1000

export function formatRelativeTime(
  date: Date,
  now: Date,
  timeZone: string,
  locale: Locale,
): string {
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const minutes = Math.round((date.getTime() - now.getTime()) / minuteInMs)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  if (Math.abs(minutes) < 1) {
    return relative.format(0, 'second')
  }
  if (Math.abs(minutes) < 60) {
    return relative.format(minutes, 'minute')
  }
  if (Math.abs(hours) < 24) {
    return relative.format(hours, 'hour')
  }
  if (Math.abs(days) < 7) {
    return relative.format(days, 'day')
  }
  return formatShortDate(date, timeZone, locale)
}
