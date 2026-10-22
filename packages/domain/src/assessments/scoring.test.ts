import { describe, expect, it } from '@jest/globals'
import { gad2 } from './gad2.ts'
import { gad7 } from './gad7.ts'
import { instrumentIds, type Instrument } from './instrument.ts'
import { phq2 } from './phq2.ts'
import { phq9 } from './phq9.ts'
import {
  domainOf,
  instruments,
  InvalidAnswersError,
  isStorable,
  maxScoreOf,
  PositiveScreenError,
  scoreAssessment,
} from './scoring.ts'

function answersTotaling(instrument: Instrument, total: number): number[] {
  return Array.from({ length: instrument.itemCount }, (_, index) =>
    Math.min(3, Math.max(0, total - index * 3)),
  )
}

function answersWith(instrument: Instrument, value: number, at: number): number[] {
  return Array.from({ length: instrument.itemCount }, (_, index) => (index === at ? value : 0))
}

describe('instruments', () => {
  it('has the two full forms and their two-item screens', () => {
    expect(phq9.itemCount).toBe(9)
    expect(gad7.itemCount).toBe(7)
    expect(phq2.itemCount).toBe(3)
    expect(phq2.scoredItems).toBe(2)
    expect(gad2.itemCount).toBe(2)
    expect(instruments).toEqual({ phq9, gad7, phq2, gad2 })
    expect(instrumentIds.map((id) => instruments[id].id)).toEqual(['phq9', 'gad7', 'phq2', 'gad2'])
  })

  it('places each form in its area', () => {
    expect(instrumentIds.map(domainOf)).toEqual(['depression', 'anxiety', 'depression', 'anxiety'])
  })

  it('knows the highest possible score of each form', () => {
    expect(maxScoreOf(phq9)).toBe(27)
    expect(maxScoreOf(gad7)).toBe(21)
    expect(maxScoreOf(phq2)).toBe(6)
    expect(maxScoreOf(gad2)).toBe(6)
  })

  it('watches PHQ-9 item 9, the one about self-harm, in the full form and the mood screen', () => {
    expect(phq9.riskItemIndex).toBe(8)
    expect(phq2.riskItemIndex).toBe(2)
    expect(gad7.riskItemIndex).toBeNull()
    expect(gad2.riskItemIndex).toBeNull()
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

describe('short screens', () => {
  it.each([
    [phq2, [0, 0, 0], 0],
    [phq2, [1, 1, 0], 2],
    [phq2, [2, 0, 0], 2],
    [gad2, [0, 2], 2],
  ])('stores a negative %s as a low result', (instrument, answers, total) => {
    expect(isStorable(instrument, answers)).toBe(true)
    expect(scoreAssessment(instrument, answers)).toEqual({
      totalScore: total,
      severity: 'minimal',
      hasRiskFlag: false,
    })
  })

  it.each([1, 2, 3])(
    'flags risk on a negative mood screen when item 9 is answered with %p',
    (value) => {
      expect(scoreAssessment(phq2, [0, 1, value])).toEqual({
        totalScore: 1,
        severity: 'minimal',
        hasRiskFlag: true,
      })
    },
  )

  it.each([
    [phq2, [2, 1, 0]],
    [phq2, [3, 3, 0]],
    [gad2, [0, 3]],
  ])('refuses a positive %s, which continues with the full form', (instrument, answers) => {
    expect(isStorable(instrument, answers)).toBe(false)
    expect(() => scoreAssessment(instrument, answers)).toThrow(new PositiveScreenError(instrument))
    expect(() => scoreAssessment(instrument, answers)).toThrow(
      `${instrument.name} is positive, so the full form has to be answered`,
    )
  })

  it('accepts any full form, whatever its first two answers', () => {
    expect(isStorable(phq9, [0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(true)
    expect(isStorable(gad7, [3, 3, 0, 0, 0, 0, 0])).toBe(true)
  })

  it('refuses a short screen with the wrong number of answers', () => {
    expect(() => scoreAssessment(phq2, [0, 0])).toThrow(new InvalidAnswersError(phq2))
  })
})
