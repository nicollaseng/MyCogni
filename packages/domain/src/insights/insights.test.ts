import { describe, expect, it } from '@jest/globals'
import { insightAttentionLevels, insightAudiences, isInsightDue } from './insights.ts'

describe('insights', () => {
  it('writes a new summary once seven check-ins have come in since the last one', () => {
    expect(isInsightDue(6)).toBe(false)
    expect(isInsightDue(7)).toBe(true)
    expect(isInsightDue(12)).toBe(true)
  })

  it('writes one summary for the person and another for each professional', () => {
    expect(insightAudiences).toEqual(['patient', 'professional'])
    expect(insightAttentionLevels).toEqual(['none', 'watch', 'urgent'])
  })
})
