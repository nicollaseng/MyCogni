import { describe, expect, it } from '@jest/globals'
import { formatLongDate } from './time'

describe('formatLongDate', () => {
  it('writes the weekday, day and month in Portuguese', () => {
    expect(formatLongDate(new Date('2026-10-14T15:00:00Z'), 'America/Sao_Paulo')).toBe(
      'Quarta-feira, 14 de outubro',
    )
  })

  it('uses the day of the given time zone, not the UTC day', () => {
    expect(formatLongDate(new Date('2026-10-15T01:30:00Z'), 'America/Sao_Paulo')).toBe(
      'Quarta-feira, 14 de outubro',
    )
  })
})
