import { describe, expect, it } from '@jest/globals'
import type { CheckIn } from '@mycogni/contracts'
import { groupByDay } from './group-by-day'

function checkIn(recordedAt: string, moodLevel = 3): CheckIn {
  return {
    id: `0b7c6c8e-6a8f-4f53-9f4b-${String(Date.parse(recordedAt)).slice(-12)}`,
    moodLevel,
    emotions: [],
    contexts: [],
    note: null,
    recordedAt,
  }
}

const options = { timeZone: 'America/Sao_Paulo', now: new Date('2026-10-14T18:00:00Z') }

describe('groupByDay', () => {
  it('tells today and yesterday apart from older days', () => {
    const groups = groupByDay(
      [
        checkIn('2026-10-14T15:00:00Z'),
        checkIn('2026-10-13T15:00:00Z'),
        checkIn('2026-10-10T15:00:00Z'),
      ],
      options,
    )

    expect(groups.map((group) => [group.key, group.day])).toEqual([
      ['2026-10-14', 'today'],
      ['2026-10-13', 'yesterday'],
      ['2026-10-10', 'earlier'],
    ])
    expect(groups.at(-1)?.date).toEqual(new Date('2026-10-10T15:00:00Z'))
  })

  it('keeps the records of the same local day together, in the given order', () => {
    const groups = groupByDay(
      [
        checkIn('2026-10-14T23:30:00Z', 5),
        checkIn('2026-10-14T12:00:00Z', 2),
        checkIn('2026-10-14T02:00:00Z', 1),
      ],
      options,
    )

    expect(
      groups.map((group) => [group.day, group.checkIns.map((item) => item.moodLevel)]),
    ).toEqual([
      ['today', [5, 2]],
      ['yesterday', [1]],
    ])
  })

  it('has no groups without records', () => {
    expect(groupByDay([], options)).toEqual([])
  })
})
