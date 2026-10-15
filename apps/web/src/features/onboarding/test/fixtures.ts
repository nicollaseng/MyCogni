import { jest } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import type { ActionResult, OnboardingActions } from '../model'

export function assessmentOf(overrides: Partial<Assessment> = {}): Assessment {
  return {
    id: '0b7c6c8e-6a8f-4f53-9f4b-000000000001',
    instrument: 'phq9',
    totalScore: 11,
    maxScore: 27,
    severity: 'moderate',
    hasRiskFlag: false,
    completedAt: '2026-10-14T12:00:00.000Z',
    ...overrides,
  }
}

export const saved: ActionResult<null> = { ok: true, value: null }

export function fakeActions(overrides: Partial<OnboardingActions> = {}) {
  return {
    acceptConsents: jest.fn<OnboardingActions['acceptConsents']>().mockResolvedValue(saved),
    saveName: jest.fn<OnboardingActions['saveName']>().mockResolvedValue(saved),
    submitScreening: jest
      .fn<OnboardingActions['submitScreening']>()
      .mockImplementation(({ instrument, answers }) =>
        Promise.resolve({
          ok: true,
          value: assessmentOf({
            instrument,
            totalScore: answers.reduce((sum, answer) => sum + answer, 0),
            maxScore: answers.length * 3,
            hasRiskFlag: instrument === 'phq9' && (answers[8] ?? 0) > 0,
          }),
        }),
      ),
    finishOnboarding: jest.fn<OnboardingActions['finishOnboarding']>().mockResolvedValue(saved),
    ...overrides,
  }
}
