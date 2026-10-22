import { describe, expect, it } from '@jest/globals'
import type { Assessment, Consent, Profile } from '@mycogni/contracts'
import { instruments, maxScoreOf } from '@mycogni/domain'
import { phaseOf, resumeFrom, type Step } from './model'

const profile: Profile = {
  id: '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10',
  email: 'ana@exemplo.com',
  accountType: 'patient',
  displayName: 'Ana',
  avatarPath: null,
  timezone: 'America/Sao_Paulo',
  locale: null,
  journalInInsights: false,
  memoriesEnabled: true,
  termsOutdated: false,
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
    maxScore: maxScoreOf(instruments[instrument]),
    severity: 'mild',
    hasRiskFlag: false,
    completedAt,
  }
}

describe('resumeFrom', () => {
  const base = { userId: profile.id, displayName: 'Ana' }

  it('starts with the consents when a required one is missing', () => {
    const start = resumeFrom(profile, [consent('terms'), consent('ai_processing')], [])

    expect(start).toEqual({ ...base, step: 'consents', results: {}, assessments: [] })
  })

  it('goes to the name once the consents are given', () => {
    expect(resumeFrom({ ...profile, displayName: null }, required, [])).toEqual({
      ...base,
      step: 'name',
      displayName: '',
      results: {},
      assessments: [],
    })
  })

  it('goes back to the questions while one area is still open', () => {
    const phq2 = assessment('phq2', 1, '2026-10-14T12:05:00.000Z')

    expect(resumeFrom(profile, required, [phq2])).toEqual({
      ...base,
      step: 'screening',
      results: { depression: phq2 },
      assessments: [phq2],
    })
  })

  it('shows the results with the latest answer of each area, short or full', () => {
    const latestPhq9 = assessment('phq9', 9, '2026-10-14T12:10:00.000Z')
    const gad2 = assessment('gad2', 2, '2026-10-14T12:08:00.000Z')
    const olderPhq2 = assessment('phq2', 1, '2026-10-14T12:05:00.000Z')
    const all = [latestPhq9, gad2, olderPhq2]

    expect(resumeFrom(profile, required, all)).toEqual({
      ...base,
      step: 'results',
      results: { depression: latestPhq9, anxiety: gad2 },
      assessments: all,
    })
  })
})

describe('phaseOf', () => {
  it('groups the questionnaire screens in one phase', () => {
    const screeningSteps: Step[] = ['intro', 'screening']

    expect(new Set(screeningSteps.map(phaseOf))).toEqual(new Set(['screening']))
    expect(phaseOf('photo')).toBe('name')
    expect(phaseOf('consents')).toBe('consents')
    expect(phaseOf('results')).toBe('results')
  })
})
