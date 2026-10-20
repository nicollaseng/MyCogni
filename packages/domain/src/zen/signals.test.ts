import { describe, expect, it } from '@jest/globals'
import {
  fallbackTimeZone,
  isNight,
  localHour,
  nightEndsAt,
  nightStartsAt,
  recentRecords,
  recordWindowDays,
  windowStart,
} from './signals.ts'

const now = new Date('2026-10-20T15:00:00Z')

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('recentRecords', () => {
  it('averages the mood over 7 days and keeps 14 days of tags for the record rules', () => {
    const records = [
      { moodLevel: 1, emotions: ['anxiety'], contexts: ['sleep'], recordedAt: daysAgo(1) },
      { moodLevel: 3, emotions: [], contexts: ['work'], recordedAt: daysAgo(7) },
      { moodLevel: 0, emotions: [], contexts: ['sleep'], recordedAt: daysAgo(10) },
      { moodLevel: 6, emotions: [], contexts: ['sleep'], recordedAt: daysAgo(14) },
      { moodLevel: 6, emotions: [], contexts: ['sleep'], recordedAt: daysAgo(15) },
    ]

    const recent = recentRecords(records, now)

    expect(recent.moodAverage).toBe(2)
    expect(recent.records).toEqual([
      { moodLevel: 1, emotions: ['anxiety'], contexts: ['sleep'] },
      { moodLevel: 3, emotions: [], contexts: ['work'] },
      { moodLevel: 0, emotions: [], contexts: ['sleep'] },
      { moodLevel: 6, emotions: [], contexts: ['sleep'] },
    ])
  })

  it('has no average without recent records', () => {
    expect(recentRecords([], now)).toEqual({ moodAverage: null, records: [] })
    expect(windowStart(now, recordWindowDays).toISOString()).toBe('2026-10-06T15:00:00.000Z')
  })
})

describe('isNight', () => {
  it('counts 21:00 to 04:59 in the person own time zone as night', () => {
    expect(nightStartsAt).toBe(21)
    expect(nightEndsAt).toBe(5)
    expect(isNight(new Date('2026-10-21T00:00:00Z'), 'America/Sao_Paulo')).toBe(true)
    expect(isNight(new Date('2026-10-20T23:59:00Z'), 'America/Sao_Paulo')).toBe(false)
    expect(isNight(new Date('2026-10-21T07:59:00Z'), 'America/Sao_Paulo')).toBe(true)
    expect(isNight(new Date('2026-10-21T08:00:00Z'), 'America/Sao_Paulo')).toBe(false)
  })

  it('follows summer time where it exists', () => {
    expect(isNight(new Date('2026-07-15T20:00:00Z'), 'Europe/London')).toBe(true)
    expect(isNight(new Date('2026-12-15T20:00:00Z'), 'Europe/London')).toBe(false)
    expect(isNight(new Date('2026-12-15T21:00:00Z'), 'Europe/London')).toBe(true)
  })

  it('falls back to the app time zone when the profile has an invalid one', () => {
    expect(fallbackTimeZone).toBe('America/Sao_Paulo')
    expect(localHour(new Date('2026-10-21T00:30:00Z'), 'Mars/Olympus')).toBe(21)
    expect(localHour(new Date('2026-10-21T00:30:00Z'), 'Asia/Tokyo')).toBe(9)
  })
})
