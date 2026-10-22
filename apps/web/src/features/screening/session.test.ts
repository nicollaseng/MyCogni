import { describe, expect, it } from '@jest/globals'
import { assessmentOf } from '@/features/onboarding/test/fixtures'
import { resultsBefore, startedSession } from './session'

const before = assessmentOf({
  id: '1b7c6c8e-6a8f-4f53-9f4b-000000000001',
  completedAt: '2026-10-01T13:00:00Z',
})
const savedNow = assessmentOf({
  id: '1b7c6c8e-6a8f-4f53-9f4b-000000000002',
  instrument: 'phq2',
  totalScore: 1,
  maxScore: 6,
  severity: 'minimal',
  completedAt: '2026-10-22T13:00:00Z',
})

describe('startedSession', () => {
  it('counts any earlier answer during onboarding', () => {
    const { session, saved } = startedSession('onboarding', [before], null)

    expect(saved).toEqual({ depression: before })
    expect(session.saved).toEqual({ depression: 'phq9' })
  })

  it('counts only what this retake saved and keeps its answers', () => {
    const draft = {
      updatedAt: Date.now(),
      answers: { depression: { 0: 0, 1: 1, 8: 0 } as const, anxiety: { 0: 1 } as const },
      saved: { depression: savedNow.id },
    }

    const { session, saved } = startedSession('retake', [savedNow, before], draft)

    expect(saved).toEqual({ depression: savedNow })
    expect(session).toEqual({ answers: draft.answers, saved: { depression: 'phq2' } })
    expect(startedSession('retake', [before], null).saved).toEqual({})
  })

  it('compares with what came before this session', () => {
    expect(resultsBefore([savedNow, before], { depression: savedNow })).toEqual({
      depression: before,
    })
  })
})
