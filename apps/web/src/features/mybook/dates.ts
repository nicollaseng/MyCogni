import { dayKey, type Locale } from '@mycogni/domain'

function capitalized(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function sameYear(date: Date, now: Date, timeZone: string): boolean {
  return dayKey(date, timeZone).slice(0, 4) === dayKey(now, timeZone).slice(0, 4)
}

export function formatMonth(date: Date, now: Date, timeZone: string, locale: Locale): string {
  return capitalized(
    new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: sameYear(date, now, timeZone) ? undefined : 'numeric',
      timeZone,
    }).format(date),
  )
}

export function formatPageDate(date: Date, now: Date, timeZone: string, locale: Locale): string {
  if (dayKey(date, timeZone) === dayKey(now, timeZone)) {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone }).format(
      date,
    )
  }
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: sameYear(date, now, timeZone) ? undefined : 'numeric',
    timeZone,
  }).format(date)
}

export function formatDay(date: Date, now: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: sameYear(date, now, timeZone) ? undefined : 'numeric',
    timeZone,
  }).format(date)
}

export function formatMoment(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

export function formatWritten(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone,
  }).format(date)
}
