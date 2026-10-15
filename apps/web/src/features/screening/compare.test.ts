import { describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import { comparisonOf } from './compare'

function result(totalScore: number, completedAt: string): Assessment {
  return {
    id: '0b7c6c8e-6a8f-4f53-9f4b-000000000001',
    instrument: 'phq9',
    totalScore,
    maxScore: 27,
    severity: 'mild',
    hasRiskFlag: false,
    completedAt,
  }
}

const before = result(17, '2026-10-01T13:00:00Z')
const zone = 'America/Sao_Paulo'

describe('comparisonOf', () => {
  it('says how many points went down since the previous time', () => {
    expect(comparisonOf(result(14, '2026-10-15T13:00:00Z'), before, zone, 'pt-BR')).toEqual({
      change: 'down',
      points: 3,
      day: '1 de outubro',
    })
  })

  it('says how many points went up', () => {
    expect(comparisonOf(result(18, '2026-10-15T13:00:00Z'), before, zone, 'pt-BR')).toEqual({
      change: 'up',
      points: 1,
      day: '1 de outubro',
    })
  })

  it('says when nothing changed', () => {
    expect(comparisonOf(result(17, '2026-10-15T13:00:00Z'), before, zone, 'pt-BR').change).toBe(
      'same',
    )
  })

  it('writes the day the way each language does', () => {
    const now = result(17, '2026-10-15T13:00:00Z')
    expect(comparisonOf(now, before, zone, 'en-US').day).toBe('October 1')
    expect(comparisonOf(now, before, zone, 'en-GB').day).toBe('1 October')
    expect(comparisonOf(now, before, zone, 'pt-PT').day).toBe('1 de outubro')
  })
})
