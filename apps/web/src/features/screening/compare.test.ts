import { describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import { comparedTo } from './compare'

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

describe('comparedTo', () => {
  it('says how many points went down since the previous time', () => {
    expect(comparedTo(result(14, '2026-10-15T13:00:00Z'), before, zone)).toBe(
      '3 pontos a menos que em 1 de outubro',
    )
  })

  it('says how many points went up, in the singular when it is one', () => {
    expect(comparedTo(result(18, '2026-10-15T13:00:00Z'), before, zone)).toBe(
      '1 ponto a mais que em 1 de outubro',
    )
  })

  it('says when nothing changed', () => {
    expect(comparedTo(result(17, '2026-10-15T13:00:00Z'), before, zone)).toBe(
      'Igual a 1 de outubro',
    )
  })
})
