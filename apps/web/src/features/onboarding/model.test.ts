import { describe, expect, it } from '@jest/globals'
import type { Assessment, Consent, Profile } from '@mycogni/contracts'
import { phaseOf, resumeFrom, type Step } from './model'

const profile: Profile = {
  id: '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10',
  email: 'ana@exemplo.com',
  displayName: 'Ana',
  avatarPath: null,
  timezone: 'America/Sao_Paulo',
  locale: null,
  onboardingCompletedAt: null,
}

function consent(kind: Consent['kind']): Consent {
  return { kind, version: '2026-10', grantedAt: '2026-10-14T12:00:00.000Z' }
}

const required = [consent('terms'), consent('privacy'), consent('health_data'), consent('adult')]

function assessment(
  instrument: Assessment['instrument'],
  totalScore: number,
  completedAt: string,
): Assessment {
  return {
    id: `0b7c6c8e-6a8f-4f53-9f4b-${String(totalScore).padStart(12, '0')}`,
    instrument,
    totalScore,
    maxScore: instrument === 'phq9' ? 27 : 21,
    severity: 'mild',
    hasRiskFlag: false,
    completedAt,
  }
}

describe('resumeFrom', () => {
  it('starts with the consents when a required one is missing', () => {
    const start = resumeFrom(profile, [consent('terms'), consent('ai_processing')], [])

    expect(start).toEqual({ step: 'consents', displayName: 'Ana', results: {} })
  })

  it('goes to the name once the consents are given', () => {
    expect(resumeFrom({ ...profile, displayName: null }, required, [])).toEqual({
      step: 'name',
      displayName: '',
      results: {},
    })
  })

  it('picks up at GAD-7 after PHQ-9 is answered', () => {
    const phq9 = assessment('phq9', 7, '2026-10-14T12:05:00.000Z')

    expect(resumeFrom(profile, required, [phq9])).toEqual({
      step: 'gad7',
      displayName: 'Ana',
      results: { phq9 },
    })
  })

  it('shows the results with the latest answer of each form', () => {
    const latestPhq9 = assessment('phq9', 9, '2026-10-14T12:10:00.000Z')
    const gad7 = assessment('gad7', 4, '2026-10-14T12:08:00.000Z')
    const olderPhq9 = assessment('phq9', 3, '2026-10-14T12:05:00.000Z')

    expect(resumeFrom(profile, required, [latestPhq9, gad7, olderPhq9])).toEqual({
      step: 'results',
      displayName: 'Ana',
      results: { phq9: latestPhq9, gad7 },
    })
  })
})

describe('phaseOf', () => {
  it('groups the questionnaire screens in one phase', () => {
    const screeningSteps: Step[] = ['intro', 'phq9', 'support', 'gad7']

    expect(new Set(screeningSteps.map(phaseOf))).toEqual(new Set(['screening']))
    expect(phaseOf('consents')).toBe('consents')
    expect(phaseOf('results')).toBe('results')
  })
})
