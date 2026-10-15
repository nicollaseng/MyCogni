import { describe, expect, it } from '@jest/globals'
import { onboardingStepOf, photoStepDoneIn, photoStepFlag, stepNumberOf } from './onboarding'
import { registrationDocument } from './test-data'

const document = registrationDocument()

describe('professional onboarding steps', () => {
  it('starts with the document while none was sent', () => {
    expect(onboardingStepOf({ status: 'pending', document: null }, false)).toBe('document')
    expect(onboardingStepOf({ status: 'pending', document: null }, true)).toBe('document')
  })

  it('offers the photo once the document arrived, until it is added or skipped', () => {
    expect(onboardingStepOf({ status: 'pending', document }, false)).toBe('photo')
    expect(onboardingStepOf({ status: 'pending', document }, true)).toBe('review')
  })

  it('asks a rejected professional for a new document', () => {
    expect(onboardingStepOf({ status: 'rejected', document }, true)).toBe('document')
  })

  it('remembers the photo step only from an explicit flag', () => {
    expect(photoStepDoneIn({ [photoStepFlag]: true })).toBe(true)
    expect(photoStepDoneIn({ [photoStepFlag]: 'yes' })).toBe(false)
    expect(photoStepDoneIn({})).toBe(false)
    expect(photoStepDoneIn(undefined)).toBe(false)
  })

  it('numbers the steps from one', () => {
    expect(stepNumberOf('document')).toBe(1)
    expect(stepNumberOf('photo')).toBe(2)
    expect(stepNumberOf('review')).toBe(3)
  })
})
