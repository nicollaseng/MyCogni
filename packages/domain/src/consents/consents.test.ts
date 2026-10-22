import { describe, expect, it } from '@jest/globals'
import {
  consentKinds,
  consentVersion,
  consentVersionOf,
  isCurrentConsent,
  isPatientConsent,
  isRevocable,
  legalVersion,
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

  it('versions the terms and the privacy policy apart from the other permissions', () => {
    expect(consentKinds.filter((kind) => consentVersionOf(kind) === legalVersion)).toEqual([
      'terms',
      'privacy',
    ])
    expect(consentVersionOf('assistant_data')).toBe(consentVersion)
    expect(legalVersion).not.toBe(consentVersion)
  })

  it('tells whether a granted consent follows the current text', () => {
    expect(isCurrentConsent({ kind: 'terms', version: legalVersion })).toBe(true)
    expect(isCurrentConsent({ kind: 'terms', version: consentVersion })).toBe(false)
    expect(isCurrentConsent({ kind: 'ai_processing', version: consentVersion })).toBe(true)
    expect(isCurrentConsent({ kind: 'ai_processing', version: legalVersion })).toBe(false)
  })
})
