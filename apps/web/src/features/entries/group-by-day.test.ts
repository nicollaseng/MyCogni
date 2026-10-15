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
  it('names today and yesterday, and writes the date for older days', () => {
    const groups = groupByDay(
      [
        checkIn('2026-10-14T15:00:00Z'),
        checkIn('2026-10-13T15:00:00Z'),
        checkIn('2026-10-10T15:00:00Z'),
      ],
      options,
    )

    expect(groups.map((group) => group.label)).toEqual(['Hoje', 'Ontem', 'Sábado, 10 de outubro'])
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
      groups.map((group) => [group.label, group.checkIns.map((item) => item.moodLevel)]),
    ).toEqual([
      ['Hoje', [5, 2]],
      ['Ontem', [1]],
    ])
  })

  it('has no groups without records', () => {
    expect(groupByDay([], options)).toEqual([])
  })
})
