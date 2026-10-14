import { describe, expect, it } from '@jest/globals'
import { gad7 } from './gad7.ts'
import { instrumentIds, type Instrument } from './instrument.ts'
import { phq9 } from './phq9.ts'
import { instruments, InvalidAnswersError, maxScoreOf, scoreAssessment } from './scoring.ts'

function answersTotaling(instrument: Instrument, total: number): number[] {
  return instrument.items.map((_, index) => Math.min(3, Math.max(0, total - index * 3)))
}

function answersWith(instrument: Instrument, value: number, at: number): number[] {
  return instrument.items.map((_, index) => (index === at ? value : 0))
}

describe('instruments', () => {
  it('has nine PHQ-9 items and seven GAD-7 items', () => {
    expect(phq9.items).toHaveLength(9)
    expect(gad7.items).toHaveLength(7)
    expect(instruments).toEqual({ phq9, gad7 })
    expect(instrumentIds.map((id) => instruments[id].id)).toEqual(['phq9', 'gad7'])
  })

  it('knows the highest possible score of each form', () => {
    expect(maxScoreOf(phq9)).toBe(27)
    expect(maxScoreOf(gad7)).toBe(21)
  })

  it('watches PHQ-9 item 9, the one about self-harm', () => {
    expect(phq9.riskItemIndex).toBe(8)
    expect(phq9.items[8]).toBe(
      'Pensar em se ferir de alguma maneira ou que seria melhor estar morto/a',
    )
    expect(gad7.riskItemIndex).toBeNull()
  })
})

describe('scoreAssessment', () => {
  it.each([
    [0, 'minimal'],
    [4, 'minimal'],
    [5, 'mild'],
    [9, 'mild'],
    [10, 'moderate'],
    [14, 'moderate'],
    [15, 'moderately_severe'],
    [19, 'moderately_severe'],
    [20, 'severe'],
    [27, 'severe'],
  ])('rates a PHQ-9 total of %p as %p', (total, severity) => {
    const score = scoreAssessment(phq9, answersTotaling(phq9, total))

    expect(score.totalScore).toBe(total)
    expect(score.severity).toBe(severity)
  })

  it.each([
    [0, 'minimal'],
    [4, 'minimal'],
    [5, 'mild'],
    [9, 'mild'],
    [10, 'moderate'],
    [14, 'moderate'],
    [15, 'severe'],
    [21, 'severe'],
  ])('rates a GAD-7 total of %p as %p', (total, severity) => {
    const score = scoreAssessment(gad7, answersTotaling(gad7, total))

    expect(score.totalScore).toBe(total)
    expect(score.severity).toBe(severity)
  })

  it.each([1, 2, 3])(
    'flags risk when PHQ-9 item 9 is answered with %p, whatever the total',
    (value) => {
      expect(scoreAssessment(phq9, answersWith(phq9, value, 8))).toEqual({
        totalScore: value,
        severity: 'minimal',
        hasRiskFlag: true,
      })
    },
  )

  it('does not flag risk when item 9 is zero, even with a severe total', () => {
    const answers = answersWith(phq9, 0, 8).map((_, index) => (index === 8 ? 0 : 3))

    expect(scoreAssessment(phq9, answers)).toEqual({
      totalScore: 24,
      severity: 'severe',
      hasRiskFlag: false,
    })
  })

  it('never flags risk on GAD-7', () => {
    expect(scoreAssessment(gad7, answersTotaling(gad7, 21)).hasRiskFlag).toBe(false)
  })

  it.each([
    ['too few answers', [0, 0, 0, 0, 0, 0]],
    ['too many answers', [0, 0, 0, 0, 0, 0, 0, 0]],
    ['an answer above 3', [0, 0, 0, 4, 0, 0, 0]],
    ['a negative answer', [0, 0, 0, -1, 0, 0, 0]],
    ['a fractional answer', [0, 0, 0, 1.5, 0, 0, 0]],
  ])('refuses %s', (_, answers) => {
    expect(() => scoreAssessment(gad7, answers)).toThrow(new InvalidAnswersError(gad7))
    expect(() => scoreAssessment(gad7, answers)).toThrow('GAD-7 expects 7 answers from 0 to 3')
  })
})
