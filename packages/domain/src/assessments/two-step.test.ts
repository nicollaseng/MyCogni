import { describe, expect, it } from '@jest/globals'
import type { Answer } from './frequency.ts'
import {
  answerQuestion,
  fullFormStart,
  isScreeningComplete,
  newScreeningSession,
  nextQuestion,
  previousQuestion,
  progressAt,
  recordsToSave,
  screeningQuestions,
  type ScreeningSession,
} from './two-step.ts'

function play(session: ScreeningSession, values: readonly Answer[]): ScreeningSession {
  return values.reduce((current, value) => {
    const question = nextQuestion(current)
    if (question === null) {
      throw new Error('No question left to answer')
    }
    return answerQuestion(current, question, value)
  }, session)
}

function zeros(count: number): Answer[] {
  return Array.from({ length: count }, () => 0)
}

function itemsOf(session: ScreeningSession): string[] {
  return screeningQuestions(session).map(({ domain, item }) => `${domain}:${String(item + 1)}`)
}

describe('the start', () => {
  it('asks the PHQ-4 and then the safety question, five questions in all', () => {
    expect(itemsOf(newScreeningSession)).toEqual([
      'depression:1',
      'depression:2',
      'anxiety:1',
      'anxiety:2',
      'depression:9',
    ])
    expect(nextQuestion(newScreeningSession)).toEqual({ domain: 'depression', item: 0 })
    expect(progressAt(newScreeningSession, { domain: 'depression', item: 0 })).toEqual({
      current: 1,
      total: 5,
    })
  })

  it('keeps the count at five until the four screen answers are in', () => {
    const moodPositive = play(newScreeningSession, [3, 3])

    expect(screeningQuestions(moodPositive)).toHaveLength(5)
    expect(progressAt(moodPositive, { domain: 'anxiety', item: 0 })).toEqual({
      current: 3,
      total: 5,
    })
    expect(answerQuestion(moodPositive, { domain: 'depression', item: 2 }, 1)).toBe(moodPositive)
  })

  it('saves nothing until the four screen answers are in', () => {
    const session = play(newScreeningSession, [0, 0, 0])

    expect(recordsToSave(session)).toEqual([])
    expect(progressAt(session, { domain: 'anxiety', item: 1 })).toEqual({ current: 4, total: 5 })
  })
})

describe('branching', () => {
  it('ends after five questions when both screens are negative', () => {
    const screened = play(newScreeningSession, [0, 2, 1, 1])

    expect(nextQuestion(screened)).toEqual({ domain: 'depression', item: 8 })
    expect(fullFormStart({ domain: 'depression', item: 8 })).toBeNull()
    expect(recordsToSave(screened)).toEqual([
      { domain: 'anxiety', instrument: 'gad2', answers: [1, 1] },
    ])

    const answered = play(screened, [0])

    expect(nextQuestion(answered)).toBeNull()
    expect(screeningQuestions(answered)).toHaveLength(5)
    expect(recordsToSave(answered)).toEqual([
      { domain: 'depression', instrument: 'phq2', answers: [0, 2, 0] },
      { domain: 'anxiety', instrument: 'gad2', answers: [1, 1] },
    ])
  })

  it('keeps the safety answer of a negative mood screen so the support can follow', () => {
    const answered = play(newScreeningSession, [1, 0, 0, 0, 2])

    expect(recordsToSave(answered)[0]).toEqual({
      domain: 'depression',
      instrument: 'phq2',
      answers: [1, 0, 2],
    })
  })

  it('asks the rest of the PHQ-9 once, item 9 included, when only the mood screen is positive', () => {
    const screened = play(newScreeningSession, [2, 1, 0, 1])

    expect(nextQuestion(screened)).toEqual({ domain: 'depression', item: 2 })
    expect(progressAt(screened, { domain: 'depression', item: 2 })).toEqual({
      current: 5,
      total: 11,
    })
    expect(fullFormStart({ domain: 'depression', item: 2 })).toEqual({
      domain: 'depression',
      count: 7,
    })
    expect(itemsOf(screened).filter((item) => item === 'depression:9')).toHaveLength(1)

    const answered = play(screened, [1, 0, 0, 0, 0, 0, 1])

    expect(nextQuestion(answered)).toBeNull()
    expect(recordsToSave(answered)).toEqual([
      { domain: 'depression', instrument: 'phq9', answers: [2, 1, 1, 0, 0, 0, 0, 0, 1] },
      { domain: 'anxiety', instrument: 'gad2', answers: [0, 1] },
    ])
  })

  it('asks the rest of the GAD-7 when only the anxiety screen is positive', () => {
    const screened = play(newScreeningSession, [0, 0, 3, 0])

    expect(itemsOf(screened).slice(4)).toEqual([
      'depression:9',
      'anxiety:3',
      'anxiety:4',
      'anxiety:5',
      'anxiety:6',
      'anxiety:7',
    ])
    expect(fullFormStart({ domain: 'anxiety', item: 2 })).toEqual({ domain: 'anxiety', count: 5 })
    expect(progressAt(screened, { domain: 'depression', item: 8 })).toEqual({
      current: 5,
      total: 5,
    })
    expect(progressAt(screened, { domain: 'anxiety', item: 2 })).toEqual({
      current: 6,
      total: 10,
    })

    const answered = play(screened, [0, 1, 1, 1, 1, 1])

    expect(recordsToSave(answered)).toEqual([
      { domain: 'depression', instrument: 'phq2', answers: [0, 0, 0] },
      { domain: 'anxiety', instrument: 'gad7', answers: [3, 0, 1, 1, 1, 1, 1] },
    ])
  })

  it('asks the full mood form, then the full anxiety form, when both screens are positive', () => {
    const screened = play(newScreeningSession, [3, 0, 1, 2])

    expect(screeningQuestions(screened)).toHaveLength(16)
    expect(progressAt(screened, { domain: 'depression', item: 2 })).toEqual({
      current: 5,
      total: 11,
    })
    expect(progressAt(screened, { domain: 'anxiety', item: 2 })).toEqual({
      current: 12,
      total: 16,
    })
    expect(recordsToSave(screened)).toEqual([])

    const moodDone = play(screened, zeros(7))

    expect(nextQuestion(moodDone)).toEqual({ domain: 'anxiety', item: 2 })
    expect(recordsToSave(moodDone)).toEqual([
      { domain: 'depression', instrument: 'phq9', answers: [3, 0, ...zeros(7)] },
    ])

    const answered = play({ ...moodDone, saved: { depression: 'phq9' } }, zeros(5))

    expect(recordsToSave(answered)).toEqual([
      { domain: 'anxiety', instrument: 'gad7', answers: [1, 2, ...zeros(5)] },
    ])
  })
})

describe('changing an answer', () => {
  it('drops the extra mood answers but keeps the safety answer when the screen becomes negative', () => {
    const extended = play(newScreeningSession, [2, 1, 0, 0, 1, 1])
    const withSafety = answerQuestion(extended, { domain: 'depression', item: 8 }, 0)
    const changed = answerQuestion(withSafety, { domain: 'depression', item: 1 }, 0)

    expect(changed.answers.depression).toEqual({ 0: 2, 1: 0, 8: 0 })
    expect(screeningQuestions(changed)).toHaveLength(5)
    expect(nextQuestion(changed)).toBeNull()
  })

  it('keeps the extra answers while the screen stays positive', () => {
    const extended = play(newScreeningSession, [2, 1, 0, 0, 1, 1])
    const changed = answerQuestion(extended, { domain: 'depression', item: 0 }, 3)

    expect(changed.answers.depression).toEqual({ 0: 3, 1: 1, 2: 1, 3: 1 })
    expect(nextQuestion(changed)).toEqual({ domain: 'depression', item: 4 })
  })

  it('leaves saved areas and questions that are not asked untouched', () => {
    const saved: ScreeningSession = { ...newScreeningSession, saved: { depression: 'phq2' } }

    expect(answerQuestion(saved, { domain: 'depression', item: 0 }, 3)).toBe(saved)
    expect(answerQuestion(newScreeningSession, { domain: 'depression', item: 4 }, 3)).toBe(
      newScreeningSession,
    )
  })
})

describe('going back', () => {
  it('goes back through questions that are not saved yet', () => {
    const session = play(newScreeningSession, [2, 1, 0])

    expect(previousQuestion(session, { domain: 'anxiety', item: 1 })).toEqual({
      domain: 'anxiety',
      item: 0,
    })
    expect(previousQuestion(session, { domain: 'depression', item: 0 })).toBeNull()
  })

  it('never goes back into an area that is already saved', () => {
    const session: ScreeningSession = {
      answers: { depression: { 0: 0, 1: 0 }, anxiety: { 0: 0, 1: 0 } },
      saved: { anxiety: 'gad2' },
    }

    expect(previousQuestion(session, { domain: 'depression', item: 8 })).toBeNull()
  })
})

describe('resuming', () => {
  it('counts a saved mood screen with its safety answer and goes on with anxiety', () => {
    const session: ScreeningSession = { ...newScreeningSession, saved: { depression: 'phq2' } }

    expect(nextQuestion(session)).toEqual({ domain: 'anxiety', item: 0 })
    expect(progressAt(session, { domain: 'anxiety', item: 0 })).toEqual({ current: 3, total: 5 })
    expect(previousQuestion(session, { domain: 'anxiety', item: 0 })).toBeNull()
  })

  it('counts a saved full form with all its questions', () => {
    const answered = play({ ...newScreeningSession, saved: { depression: 'phq9' } }, [0, 1])

    expect(screeningQuestions(answered)).toHaveLength(11)
    expect(nextQuestion(answered)).toBeNull()
    expect(recordsToSave(answered)).toEqual([
      { domain: 'anxiety', instrument: 'gad2', answers: [0, 1] },
    ])
  })

  it('is complete once both areas are saved', () => {
    expect(isScreeningComplete(newScreeningSession)).toBe(false)
    expect(isScreeningComplete({ ...newScreeningSession, saved: { depression: 'phq2' } })).toBe(
      false,
    )
    expect(
      isScreeningComplete({
        ...newScreeningSession,
        saved: { depression: 'phq9', anxiety: 'gad2' },
      }),
    ).toBe(true)
  })
})
