import { describe, expect, it } from '@jest/globals'
import {
  defaultAssignmentSort,
  filterCounts,
  isUpcoming,
  nextAssignmentSort,
  visibleAssignments,
} from './assignment-table'
import { assignment } from './questionnaire-test-data'

const list = [
  assignment({
    id: 'a',
    variant: 'pcl5',
    status: 'completed',
    createdAt: '2026-10-01T10:00:00Z',
    completedAt: '2026-10-02T10:00:00Z',
  }),
  assignment({ id: 'b', variant: 'k10', status: 'assigned', createdAt: '2026-10-05T10:00:00Z' }),
  assignment({ id: 'c', variant: 'asrs6', status: 'cancelled', createdAt: '2026-10-03T10:00:00Z' }),
  assignment({
    id: 'd',
    variant: 'phq9',
    status: 'in_progress',
    createdAt: '2026-10-04T10:00:00Z',
  }),
  assignment({ id: 'e', variant: 'k6', status: 'expired', createdAt: '2026-09-04T10:00:00Z' }),
]

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id)

describe('assignment table', () => {
  it('counts and filters open, answered and closed questionnaires', () => {
    expect(filterCounts(list)).toEqual({ all: 5, open: 2, completed: 1, closed: 2 })
    expect(ids(visibleAssignments(list, 'open', defaultAssignmentSort))).toEqual(['b', 'd'])
    expect(ids(visibleAssignments(list, 'closed', defaultAssignmentSort))).toEqual(['c', 'e'])
  })

  it('sorts by release date first and by any column on request', () => {
    expect(ids(visibleAssignments(list, 'all', defaultAssignmentSort))).toEqual([
      'b',
      'd',
      'c',
      'a',
      'e',
    ])
    expect(ids(visibleAssignments(list, 'all', { key: 'instrument', direction: 'asc' }))).toEqual([
      'c',
      'b',
      'e',
      'a',
      'd',
    ])
    expect(ids(visibleAssignments(list, 'all', { key: 'status', direction: 'asc' }))).toEqual([
      'b',
      'd',
      'a',
      'c',
      'e',
    ])
    expect(ids(visibleAssignments(list, 'all', { key: 'completedAt', direction: 'desc' }))[0]).toBe(
      'a',
    )
  })

  it('flips the direction of the active column and starts others in their natural order', () => {
    expect(nextAssignmentSort(defaultAssignmentSort, 'createdAt')).toEqual({
      key: 'createdAt',
      direction: 'asc',
    })
    expect(nextAssignmentSort(defaultAssignmentSort, 'instrument')).toEqual({
      key: 'instrument',
      direction: 'asc',
    })
  })

  it('knows when a repetition is not available yet', () => {
    const now = new Date('2026-10-22T12:00:00Z')
    expect(isUpcoming(assignment({ availableFrom: '2026-10-29T12:00:00Z' }), now)).toBe(true)
    expect(isUpcoming(assignment({ availableFrom: '2026-10-21T12:00:00Z' }), now)).toBe(false)
    expect(
      isUpcoming(assignment({ status: 'cancelled', availableFrom: '2026-10-29T12:00:00Z' }), now),
    ).toBe(false)
  })
})
