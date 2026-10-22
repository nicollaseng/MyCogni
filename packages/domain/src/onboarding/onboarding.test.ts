import { describe, expect, it } from '@jest/globals'
import { requiredConsentKinds } from '../consents/consents.ts'
import { isOnboardingReady } from './onboarding.ts'

describe('isOnboardingReady', () => {
  it('is ready with the required consents and both screenings answered', () => {
    expect(
      isOnboardingReady({
        grantedConsents: requiredConsentKinds,
        completedInstruments: ['gad7', 'phq9'],
      }),
    ).toBe(true)
  })

  it('is ready when a short screen answered an area', () => {
    expect(
      isOnboardingReady({
        grantedConsents: requiredConsentKinds,
        completedInstruments: ['phq2', 'gad7'],
      }),
    ).toBe(true)
    expect(
      isOnboardingReady({
        grantedConsents: requiredConsentKinds,
        completedInstruments: ['phq2', 'gad2'],
      }),
    ).toBe(true)
  })

  it('is not ready while a required consent is missing', () => {
    expect(
      isOnboardingReady({
        grantedConsents: ['terms', 'privacy', 'health_data'],
        completedInstruments: ['phq9', 'gad7'],
      }),
    ).toBe(false)
  })

  it('is not ready while a screening is unanswered', () => {
    expect(
      isOnboardingReady({ grantedConsents: requiredConsentKinds, completedInstruments: ['phq9'] }),
    ).toBe(false)
    expect(
      isOnboardingReady({
        grantedConsents: requiredConsentKinds,
        completedInstruments: ['phq2', 'phq9'],
      }),
    ).toBe(false)
  })
})
