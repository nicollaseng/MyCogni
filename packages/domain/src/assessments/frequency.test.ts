import { describe, expect, it } from '@jest/globals'
import { answerValues, isAnswer } from './frequency.ts'

describe('answers', () => {
  it('scores the four answers of the official forms from 0 to 3', () => {
    expect(answerValues).toEqual([0, 1, 2, 3])
  })

  it.each([0, 1, 2, 3])('accepts %p as an answer', (value) => {
    expect(isAnswer(value)).toBe(true)
  })

  it.each([-1, 4, 1.5, Number.NaN, '1', null, undefined])('rejects %p as an answer', (value) => {
    expect(isAnswer(value)).toBe(false)
  })
})
