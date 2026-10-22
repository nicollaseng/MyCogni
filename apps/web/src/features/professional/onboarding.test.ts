import { describe, expect, it } from '@jest/globals'
import { onboardingStepOf, photoStepDoneIn, photoStepFlag, stepNumberOf } from './onboarding'
import { registrationDocument } from './test-data'

const document = registrationDocument()

function both(value: boolean) {
  return { added: value, confirmed: value }
}

describe('professional onboarding steps', () => {
  it('starts with the document while none was sent', () => {
    expect(onboardingStepOf({ status: 'pending', document: null }, both(false))).toBe('document')
    expect(onboardingStepOf({ status: 'pending', document: null }, both(true))).toBe('document')
  })

  it('asks for the photo once the document arrived, until one is added and confirmed', () => {
    const pending = { status: 'pending', document } as const

    expect(onboardingStepOf(pending, { added: false, confirmed: false })).toBe('photo')
    expect(onboardingStepOf(pending, { added: false, confirmed: true })).toBe('photo')
    expect(onboardingStepOf(pending, { added: true, confirmed: false })).toBe('photo')
    expect(onboardingStepOf(pending, both(true))).toBe('review')
  })

  it('asks a rejected professional for a new document', () => {
    expect(onboardingStepOf({ status: 'rejected', document }, both(true))).toBe('document')
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
