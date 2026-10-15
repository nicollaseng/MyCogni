import { describe, expect, it } from '@jest/globals'
import type { CheckIn } from '@mycogni/contracts'
import { paginate, visibleCheckIns } from './pagination'

const items = Array.from({ length: 23 }, (_, index) => index + 1)

describe('paginate', () => {
  it('cuts the list into pages and says which rows are shown', () => {
    expect(paginate(items, 1, 10)).toEqual({
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      page: 1,
      pageCount: 3,
      from: 1,
      to: 10,
      total: 23,
    })
    expect(paginate(items, 3, 10)).toMatchObject({ items: [21, 22, 23], from: 21, to: 23 })
  })

  it('keeps the page inside the available range', () => {
    expect(paginate(items, 9, 10).page).toBe(3)
    expect(paginate(items, 0, 10).page).toBe(1)
  })

  it('has a single empty page when there is nothing to show', () => {
    expect(paginate([], 2, 10)).toEqual({
      items: [],
      page: 1,
      pageCount: 1,
      from: 0,
      to: 0,
      total: 0,
    })
  })
})

function checkIn(recordedAt: string, note: string | null): CheckIn {
  return {
    id: `0b7c6c8e-6a8f-4f53-9f4b-${recordedAt.slice(8, 10).padStart(12, '0')}`,
    moodLevel: 3,
    emotions: [],
    contexts: [],
    note,
    recordedAt,
  }
}

describe('visibleCheckIns', () => {
  const older = checkIn('2026-10-10T12:00:00Z', 'Dormi mal.')
  const newer = checkIn('2026-10-14T12:00:00Z', null)
  const newest = checkIn('2026-10-15T12:00:00Z', 'Caminhei.')

  it('puts the newest entries first', () => {
    expect(visibleCheckIns([older, newest, newer], { onlyNotes: false })).toEqual([
      newest,
      newer,
      older,
    ])
  })

  it('keeps only entries with a note when asked, before any pagination', () => {
    const shown = visibleCheckIns([older, newest, newer], { onlyNotes: true })

    expect(shown).toEqual([newest, older])
    expect(paginate(shown, 1, 1)).toMatchObject({ items: [newest], pageCount: 2, total: 2 })
  })
})
