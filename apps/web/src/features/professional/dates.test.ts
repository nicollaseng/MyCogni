import { describe, expect, it } from '@jest/globals'
import { formatDayKey, recencyOf } from './dates'
import { testNow, testTimeZone } from './test-data'

function minutesBefore(minutes: number): Date {
  return new Date(testNow.getTime() - minutes * 60 * 1000)
}

describe('recencyOf', () => {
  it('counts minutes and hours on the same day', () => {
    expect(recencyOf(minutesBefore(0), testNow, testTimeZone)).toEqual({ unit: 'now' })
    expect(recencyOf(minutesBefore(12), testNow, testTimeZone)).toEqual({
      unit: 'minutes',
      count: 12,
    })
    expect(recencyOf(minutesBefore(185), testNow, testTimeZone)).toEqual({
      unit: 'hours',
      count: 3,
    })
  })

  it('counts calendar days in the professional time zone for the last month', () => {
    expect(recencyOf(new Date('2026-10-15T02:30:00Z'), testNow, testTimeZone)).toEqual({
      unit: 'days',
      count: 1,
    })
    expect(recencyOf(new Date('2026-09-16T15:00:00Z'), testNow, testTimeZone)).toEqual({
      unit: 'days',
      count: 29,
    })
  })

  it('falls back to a date after a month', () => {
    expect(recencyOf(new Date('2026-09-15T15:00:00Z'), testNow, testTimeZone)).toEqual({
      unit: 'date',
    })
  })
})

describe('formatDayKey', () => {
  it('formats a calendar day without shifting it across time zones', () => {
    expect(formatDayKey('2026-10-01', 'en-US')).toBe('Oct 1')
  })
})
