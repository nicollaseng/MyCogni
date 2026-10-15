import { describe, expect, it } from '@jest/globals'
import {
  consentKinds,
  isPatientConsent,
  isRevocable,
  missingConsents,
  requiredConsentKinds,
} from './consents.ts'

describe('consents', () => {
  it('requires everything except the use of AI, which stays optional', () => {
    expect(consentKinds.filter((kind) => !requiredConsentKinds.includes(kind))).toEqual([
      'ai_processing',
      'assistant_data',
      'assistant_journal',
    ])
  })

  it('lists the required consents still missing', () => {
    expect(missingConsents([])).toEqual(['terms', 'privacy', 'health_data', 'adult'])
    expect(missingConsents(['terms', 'ai_processing'])).toEqual(['privacy', 'health_data', 'adult'])
  })

  it('has nothing missing once the required ones are granted', () => {
    expect(missingConsents(['adult', 'health_data', 'privacy', 'terms'])).toEqual([])
  })

  it('lets only the optional consents be withdrawn while keeping the account', () => {
    expect(consentKinds.filter(isRevocable)).toEqual([
      'ai_processing',
      'assistant_data',
      'assistant_journal',
    ])
  })

  it('keeps the consents about health data and the assistant for patient accounts', () => {
    expect(consentKinds.filter((kind) => !isPatientConsent(kind))).toEqual([
      'terms',
      'privacy',
      'adult',
    ])
  })
})
