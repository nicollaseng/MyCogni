import { jest } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import { instruments, maxScoreOf, scoreAssessment } from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'
import type { OnboardingActions } from '../model'

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

let created = 0

function nextId(): string {
  created += 1
  return `0b7c6c8e-6a8f-4f53-9f4b-${String(created).padStart(12, '0')}`
}

export function fakeSubmit() {
  return jest
    .fn<OnboardingActions['submitScreening']>()
    .mockImplementation(({ instrument, answers }) =>
      Promise.resolve({
        ok: true,
        value: assessmentOf({
          id: nextId(),
          instrument,
          ...scoreAssessment(instruments[instrument], answers),
          maxScore: maxScoreOf(instruments[instrument]),
        }),
      }),
    )
}

export function fakeActions(overrides: Partial<OnboardingActions> = {}) {
  return {
    acceptConsents: jest.fn<OnboardingActions['acceptConsents']>().mockResolvedValue(saved),
    saveName: jest.fn<OnboardingActions['saveName']>().mockResolvedValue(saved),
    submitScreening: fakeSubmit(),
    finishOnboarding: jest.fn<OnboardingActions['finishOnboarding']>().mockResolvedValue(saved),
    photoSaved: jest.fn<OnboardingActions['photoSaved']>().mockResolvedValue(undefined),
    ...overrides,
  }
}
