import { describe, expect, it } from '@jest/globals'
import {
  answeredCount,
  completeAnswers,
  blankAnswers,
  InvalidQuestionnaireAnswerError,
  isAllowedValue,
  isDraftOf,
  nextUnanswered,
  withAnswer,
} from './answers.ts'

describe('questionnaire answers', () => {
  it('starts with one empty answer per item', () => {
    expect(blankAnswers('gad7')).toEqual([null, null, null, null, null, null, null])
    expect(blankAnswers('pcl5')).toHaveLength(20)
  })

  it('accepts only the values of the official scale', () => {
    expect(isAllowedValue('phq9', 3)).toBe(true)
    expect(isAllowedValue('phq9', 4)).toBe(false)
    expect(isAllowedValue('k10', 0)).toBe(false)
    expect(isAllowedValue('k10', 5)).toBe(true)
    expect(isAllowedValue('pcl5', '2')).toBe(false)
  })

  it('checks that a saved draft belongs to the instrument', () => {
    expect(isDraftOf('k6', blankAnswers('k6'))).toBe(true)
    expect(isDraftOf('k6', blankAnswers('k10'))).toBe(false)
    expect(isDraftOf('k6', [0, 1, 2, 3, 4, 5])).toBe(false)
    expect(isDraftOf('k6', 'nothing')).toBe(false)
  })

  it('saves one answer at a time', () => {
    const first = withAnswer('gad7', blankAnswers('gad7'), 0, 2)
    const second = withAnswer('gad7', first, 6, 0)
    expect(second).toEqual([2, null, null, null, null, null, 0])
    expect(withAnswer('gad7', second, 0, 1)[0]).toBe(1)
  })

  it.each([
    [-1, 1],
    [7, 1],
    [1.5, 1],
    [0, 4],
  ])('refuses item %d with value %d', (item, value) => {
    expect(() => withAnswer('gad7', blankAnswers('gad7'), item, value)).toThrow(
      InvalidQuestionnaireAnswerError,
    )
  })

  it('refuses to write over a draft of another instrument', () => {
    expect(() => withAnswer('gad7', blankAnswers('phq9'), 0, 1)).toThrow(
      'GAD-7 does not accept this answer',
    )
  })

  it('knows when every item is answered', () => {
    expect(completeAnswers('k6', [0, 1, 2, 3, 4, 0])).toEqual([0, 1, 2, 3, 4, 0])
    expect(completeAnswers('k6', [0, 1, 2, 3, 4, null])).toBeNull()
    expect(completeAnswers('k6', [0, 1])).toBeNull()
  })

  it('counts answers and finds where to resume', () => {
    expect(answeredCount([1, null, 2, null])).toBe(2)
    expect(nextUnanswered([1, null, 2, null])).toBe(1)
    expect(nextUnanswered([1, 2])).toBe(2)
  })
})
