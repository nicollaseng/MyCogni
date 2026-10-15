import { describe, expect, it } from '@jest/globals'
import {
  dateOfDay,
  formatDayMonth,
  formatDayTitle,
  formatLongDate,
  formatShortDate,
  formatTime,
} from './time'

describe('formatLongDate', () => {
  it('writes the weekday, day and month in the language of the person', () => {
    const date = new Date('2026-10-14T15:00:00Z')

    expect(formatLongDate(date, 'America/Sao_Paulo', 'pt-BR')).toBe('quarta-feira, 14 de outubro')
    expect(formatLongDate(date, 'Europe/Lisbon', 'pt-PT')).toBe('quarta-feira, 14 de outubro')
    expect(formatLongDate(date, 'America/New_York', 'en-US')).toBe('Wednesday, October 14')
    expect(formatLongDate(date, 'Europe/London', 'en-GB')).toBe('Wednesday 14 October')
  })

  it('uses the day of the given time zone, not the UTC day', () => {
    expect(formatLongDate(new Date('2026-10-15T01:30:00Z'), 'America/Sao_Paulo', 'pt-BR')).toBe(
      'quarta-feira, 14 de outubro',
    )
  })
})

describe('formatDayTitle', () => {
  it('starts the date with a capital letter to head a day', () => {
    expect(formatDayTitle(new Date('2026-10-14T15:00:00Z'), 'America/Sao_Paulo', 'pt-BR')).toBe(
      'Quarta-feira, 14 de outubro',
    )
  })
})

describe('formatTime', () => {
  it('writes hours and minutes on the clock of the given time zone', () => {
    const date = new Date('2026-10-15T01:30:00Z')

    expect(formatTime(date, 'America/Sao_Paulo', 'pt-BR')).toBe('22:30')
    expect(formatTime(date, 'Europe/Lisbon', 'pt-PT')).toBe('02:30')
    expect(formatTime(date, 'America/New_York', 'en-US')).toBe('09:30 PM')
  })
})

describe('short dates', () => {
  it('writes the day and month, long or short, in the language of the person', () => {
    const date = new Date('2026-10-14T15:00:00Z')

    expect(formatDayMonth(date, 'America/Sao_Paulo', 'pt-BR')).toBe('14 de outubro')
    expect(formatDayMonth(date, 'Europe/London', 'en-GB')).toBe('14 October')
    expect(formatShortDate(date, 'America/New_York', 'en-US')).toBe('Oct 14')
  })

  it('reads a calendar day at noon so any time zone keeps it', () => {
    expect(formatDayMonth(dateOfDay('2026-10-14'), 'UTC', 'pt-BR')).toBe('14 de outubro')
  })
})
