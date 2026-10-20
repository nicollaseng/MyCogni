import { averageOf } from '../patterns/days.ts'

export interface RecordSignal {
  moodLevel: number
  emotions: readonly string[]
  contexts: readonly string[]
}

export interface DatedRecord extends RecordSignal {
  recordedAt: string
}

export const moodWindowDays = 7

export const recordWindowDays = 14

export const nightStartsAt = 21

export const nightEndsAt = 5

export const fallbackTimeZone = 'America/Sao_Paulo'

const dayMs = 24 * 60 * 60 * 1000

export function windowStart(now: Date, days: number): Date {
  return new Date(now.getTime() - days * dayMs)
}

function within<T extends DatedRecord>(records: readonly T[], since: Date): T[] {
  return records.filter((record) => Date.parse(record.recordedAt) >= since.getTime())
}

function hourIn(now: Date, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now),
  )
}

export function localHour(now: Date, timeZone: string): number {
  try {
    return hourIn(now, timeZone)
  } catch {
    return hourIn(now, fallbackTimeZone)
  }
}

export function isNight(now: Date, timeZone: string): boolean {
  const hour = localHour(now, timeZone)
  return hour >= nightStartsAt || hour < nightEndsAt
}

export interface RecentRecords {
  moodAverage: number | null
  records: RecordSignal[]
}

export function recentRecords(records: readonly DatedRecord[], now: Date): RecentRecords {
  return {
    moodAverage: averageOf(
      within(records, windowStart(now, moodWindowDays)).map((record) => record.moodLevel),
    ),
    records: within(records, windowStart(now, recordWindowDays)).map(
      ({ moodLevel, emotions, contexts }) => ({ moodLevel, emotions, contexts }),
    ),
  }
}
