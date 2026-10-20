import { describe, expect, it } from '@jest/globals'
import {
  patientInsightSystemPrompt,
  professionalInsightSystemPrompt,
} from '../../src/ai/insight-prompts.ts'

describe('insight prompts', () => {
  it('keeps questionnaire names and scores out of what the person reads', () => {
    expect(patientInsightSystemPrompt).not.toMatch(/PHQ|GAD/)
    expect(patientInsightSystemPrompt).toContain('never give scores, points or score ranges')
    expect(patientInsightSystemPrompt).toContain('as in "desânimo: alto" or "feeling down: high"')
    expect(patientInsightSystemPrompt).toContain('never another name such as "ânimo"')
  })

  it('keeps the clinical detail for professionals', () => {
    expect(professionalInsightSystemPrompt).toContain('PHQ-9 item 9')
    expect(professionalInsightSystemPrompt).toContain('total score')
  })
})
