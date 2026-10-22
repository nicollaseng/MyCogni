import { describe, expect, it } from '@jest/globals'
import type { PatientAssignment, QuestionnaireRun } from '@mycogni/contracts'
import { afterFinish, firstAvailable, initialStep, resumeIndex, withLocalAnswer } from './run'
import { openAssignment, run } from './test-data'

describe('questionnaire run', () => {
  it('starts with the notice, resumes the questions, or shows the summary', () => {
    expect(initialStep(run({ status: 'assigned', content: null }))).toBe('intro')
    expect(initialStep(run({ status: 'in_progress' }))).toBe('questions')
    expect(
      initialStep(
        run({ status: 'completed', summary: { area: 'anxiety', level: 'mild', safety: false } }),
      ),
    ).toBe('summary')
    expect(initialStep(run({ status: 'cancelled' }))).toBe('closed')
    expect(initialStep(run({ status: 'in_progress', content: null }))).toBe('closed')
  })

  it('resumes at the first unanswered question', () => {
    expect(resumeIndex([1, 2, null, null])).toBe(2)
    expect(resumeIndex([1, 2])).toBe(1)
    expect(resumeIndex([])).toBe(0)
  })

  it('shows the support step first when a safety answer was given', () => {
    const summary = { area: 'depression', level: 'low', safety: true } as const
    expect(afterFinish(run({ status: 'completed', summary }))).toBe('support')
    expect(afterFinish(run({ status: 'completed', summary: { ...summary, safety: false } }))).toBe(
      'summary',
    )
  })

  it('updates one answer locally while it saves', () => {
    expect(withLocalAnswer([null, 1, null], 2, 3)).toEqual([null, 1, 3])
  })

  it('offers the questionnaire already started first, then the oldest one', () => {
    const older: PatientAssignment = openAssignment({
      id: 'a',
      availableFrom: '2026-10-01T10:00:00Z',
    })
    const newer: PatientAssignment = openAssignment({
      id: 'b',
      availableFrom: '2026-10-20T10:00:00Z',
    })
    const started: PatientAssignment = openAssignment({
      id: 'c',
      status: 'in_progress',
      availableFrom: '2026-10-21T10:00:00Z',
    })
    expect(firstAvailable([newer, older])?.id).toBe('a')
    expect(firstAvailable([newer, older, started])?.id).toBe('c')
    expect(firstAvailable([])).toBeUndefined()
  })

  it('keeps the run shape of the API', () => {
    const value: QuestionnaireRun = run({})
    expect(value.answers).toHaveLength(value.itemCount)
  })
})
