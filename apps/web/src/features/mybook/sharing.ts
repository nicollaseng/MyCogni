import type { JournalShare } from '@mycogni/contracts'
import { dayKey, isShareActive } from '@mycogni/domain'

const dayInMs = 24 * 60 * 60 * 1000

export const durationChoices = ['week', 'month', 'until', 'forever'] as const

export type DurationChoice = (typeof durationChoices)[number]

export type ShareDuration =
  { kind: 'days'; days: number } | { kind: 'until'; day: string } | { kind: 'forever' }

export type ShareState =
  { kind: 'none' } | { kind: 'entries'; count: number } | { kind: 'all'; until: Date | null }

const choiceDays: Readonly<Record<'week' | 'month', number>> = { week: 7, month: 30 }

function zoneOffset(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value ?? '0')
  const local = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  )
  return local - Math.floor(instant / 1000) * 1000
}

export function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + dayInMs).toISOString().slice(0, 10)
}

export function startOfDay(day: string, timeZone: string): Date {
  const midnight = Date.parse(`${day}T00:00:00Z`)
  const guess = midnight - zoneOffset(midnight, timeZone)
  return new Date(midnight - zoneOffset(guess, timeZone))
}

export function firstDayToChoose(now: Date, timeZone: string): string {
  return nextDay(dayKey(now, timeZone))
}

export function durationOf(
  choice: DurationChoice,
  day: string,
  now: Date,
  timeZone: string,
): ShareDuration | null {
  if (choice === 'forever') {
    return { kind: 'forever' }
  }
  if (choice === 'until') {
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= firstDayToChoose(now, timeZone)
    return valid ? { kind: 'until', day } : null
  }
  return { kind: 'days', days: choiceDays[choice] }
}

export function expiresAtOf(duration: ShareDuration, now: Date, timeZone: string): Date | null {
  switch (duration.kind) {
    case 'days':
      return new Date(now.getTime() + duration.days * dayInMs)
    case 'until':
      return new Date(startOfDay(nextDay(duration.day), timeZone).getTime() - 1)
    case 'forever':
      return null
  }
}

export function isLive(share: JournalShare, now: Date): boolean {
  return isShareActive(
    {
      revokedAt: share.revokedAt === null ? null : new Date(share.revokedAt),
      expiresAt: share.expiresAt === null ? null : new Date(share.expiresAt),
    },
    now,
  )
}

export function shareStateOf(shares: readonly JournalShare[], now: Date): ShareState {
  const live = shares.filter((share) => isLive(share, now))
  const whole = live.filter((share) => share.scope === 'all')
  if (whole.length > 0) {
    if (whole.some((share) => share.expiresAt === null)) {
      return { kind: 'all', until: null }
    }
    const latest = Math.max(...whole.map((share) => Date.parse(share.expiresAt ?? '')))
    return { kind: 'all', until: new Date(latest) }
  }
  const pages = new Set(live.flatMap((share) => share.entryIds))
  return pages.size === 0 ? { kind: 'none' } : { kind: 'entries', count: pages.size }
}

function folded(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function matchingPages<T extends { title: string | null; excerpt: string }>(
  pages: readonly T[],
  query: string,
): T[] {
  const needle = folded(query.trim())
  if (needle === '') {
    return [...pages]
  }
  return pages.filter((page) => folded(`${page.title ?? ''} ${page.excerpt}`).includes(needle))
}
