import { dayKey, type Locale } from '@mycogni/domain'

const dayInMs = 24 * 60 * 60 * 1000
const minuteInMs = 60 * 1000
const recentDays = 29

export type Recency =
  { unit: 'now' } | { unit: 'minutes' | 'hours' | 'days'; count: number } | { unit: 'date' }

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

export function formatEntryDate(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  }).format(date)
}

function dayDate(day: string): Date {
  return new Date(`${day}T12:00:00Z`)
}

export function formatDayKey(day: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(dayDate(day))
}

export function formatDayKeyLong(day: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(dayDate(day))
}

export function daysAgo(date: Date, now: Date, timeZone: string): number {
  const then = Date.parse(`${dayKey(date, timeZone)}T00:00:00Z`)
  const today = Date.parse(`${dayKey(now, timeZone)}T00:00:00Z`)
  return Math.max(0, Math.round((today - then) / dayInMs))
}

export function recencyOf(date: Date, now: Date, timeZone: string): Recency {
  const days = daysAgo(date, now, timeZone)
  if (days > recentDays) {
    return { unit: 'date' }
  }
  if (days > 0) {
    return { unit: 'days', count: days }
  }
  const minutes = Math.floor(Math.max(0, now.getTime() - date.getTime()) / minuteInMs)
  if (minutes < 1) {
    return { unit: 'now' }
  }
  return minutes < 60
    ? { unit: 'minutes', count: minutes }
    : { unit: 'hours', count: Math.floor(minutes / 60) }
}
