import { describe, expect, it } from '@jest/globals'
import {
  dateOfDay,
  formatDayMonth,
  formatDayTitle,
  formatLongDate,
  formatRelativeTime,
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

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-15T15:00:00Z')

  function ago(minutes: number): Date {
    return new Date(now.getTime() - minutes * 60 * 1000)
  }

  it('says how long ago something happened in the language of the person', () => {
    expect(formatRelativeTime(ago(0), now, 'America/Sao_Paulo', 'pt-BR')).toBe('agora')
    expect(formatRelativeTime(ago(5), now, 'America/Sao_Paulo', 'pt-BR')).toBe('há 5 minutos')
    expect(formatRelativeTime(ago(180), now, 'America/Sao_Paulo', 'pt-BR')).toBe('há 3 horas')
    expect(formatRelativeTime(ago(24 * 60), now, 'America/Sao_Paulo', 'pt-BR')).toBe('ontem')
    expect(formatRelativeTime(ago(3 * 24 * 60), now, 'America/New_York', 'en-US')).toBe(
      '3 days ago',
    )
  })

  it('writes the date once it is more than a week old', () => {
    expect(formatRelativeTime(ago(10 * 24 * 60), now, 'Europe/London', 'en-GB')).toBe('5 Oct')
  })
})
