import { describe, expect, it } from '@jest/globals'
import { formatMonth, formatPageDate } from './dates'
import { groupByMonth } from './months'
import { now, summaryOf, timeZone } from './test-data'

describe('groupByMonth', () => {
  it('groups pages by the month they were last written, newest first', () => {
    const pages = [
      summaryOf({ id: 'a', updatedAt: '2026-10-15T12:00:00.000Z' }),
      summaryOf({ id: 'b', updatedAt: '2026-10-01T12:00:00.000Z' }),
      summaryOf({ id: 'c', updatedAt: '2026-09-20T12:00:00.000Z' }),
      summaryOf({ id: 'd', updatedAt: '2025-10-03T12:00:00.000Z' }),
    ]

    const groups = groupByMonth(pages, timeZone)

    expect(groups.map((group) => group.key)).toEqual(['2026-10', '2026-09', '2025-10'])
    expect(groups[0]?.pages.map((page) => page.id)).toEqual(['a', 'b'])
  })

  it('uses the time zone of the person to decide the month', () => {
    const lateOnSeptember30 = summaryOf({ updatedAt: '2026-10-01T01:30:00.000Z' })

    expect(groupByMonth([lateOnSeptember30], timeZone)[0]?.key).toBe('2026-09')
    expect(groupByMonth([lateOnSeptember30], 'Europe/Lisbon')[0]?.key).toBe('2026-10')
  })
})

describe('page dates', () => {
  it('names the month and adds the year only for other years', () => {
    expect(formatMonth(new Date('2026-09-10T12:00:00Z'), now, timeZone, 'pt-BR')).toBe('Setembro')
    expect(formatMonth(new Date('2025-09-10T12:00:00Z'), now, timeZone, 'pt-BR')).toBe(
      'Setembro de 2025',
    )
  })

  it('shows the time for pages of today and a short date otherwise', () => {
    expect(formatPageDate(new Date('2026-10-15T13:05:00Z'), now, timeZone, 'pt-BR')).toBe('10:05')
    expect(formatPageDate(new Date('2026-10-02T13:05:00Z'), now, timeZone, 'pt-BR')).toBe(
      '2 de out.',
    )
  })
})
