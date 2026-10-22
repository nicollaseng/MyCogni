import { describe, expect, it } from '@jest/globals'
import { latestPerDomain } from './latest.ts'

describe('latestPerDomain', () => {
  it('keeps the newest answer of each area, short screen or full form', () => {
    const records = [
      { id: 'a', instrument: 'phq9', completedAt: '2026-09-01T10:00:00.000Z' },
      { id: 'b', instrument: 'phq2', completedAt: '2026-10-01T10:00:00.000Z' },
      { id: 'c', instrument: 'gad7', completedAt: '2026-10-01T10:00:00.000Z' },
      { id: 'd', instrument: 'gad2', completedAt: '2026-09-15T10:00:00.000Z' },
    ] as const

    expect(latestPerDomain(records)).toEqual({ depression: records[1], anxiety: records[2] })
  })

  it('works with dates and leaves out answers before a moment', () => {
    const records = [
      { instrument: 'phq9' as const, completedAt: new Date('2026-10-01T10:00:00Z') },
      { instrument: 'gad2' as const, completedAt: new Date('2026-10-03T10:00:00Z') },
    ]

    expect(latestPerDomain(records, new Date('2026-10-02T00:00:00Z'))).toEqual({
      anxiety: records[1],
    })
    expect(latestPerDomain([])).toEqual({})
  })
})
