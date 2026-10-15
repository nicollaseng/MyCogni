import { describe, expect, it } from '@jest/globals'
import {
  accountTypeChoiceMinutes,
  isAccountType,
  isBrandNewAccount,
  signUpAccountType,
} from './account-types.ts'

const now = new Date('2026-10-15T12:00:00Z')

function minutesAgo(minutes: number): Date {
  return new Date(now.getTime() - minutes * 60_000)
}

describe('account types', () => {
  it('knows only the patient and the professional accounts', () => {
    expect(isAccountType('patient')).toBe(true)
    expect(isAccountType('professional')).toBe(true)
    expect(isAccountType('admin')).toBe(false)
    expect(isAccountType(null)).toBe(false)
  })

  it('opens a professional account only when the sign up asks for one', () => {
    expect(signUpAccountType('professional')).toBe('professional')
    expect(signUpAccountType('patient')).toBe('patient')
    expect(signUpAccountType('admin')).toBe('patient')
    expect(signUpAccountType('Professional')).toBe('patient')
    expect(signUpAccountType(undefined)).toBe('patient')
    expect(signUpAccountType(['professional'])).toBe('patient')
  })
})

describe('isBrandNewAccount', () => {
  const fresh = { createdAt: minutesAgo(5), onboardingCompletedAt: null, records: 0 }

  it('accepts an account created moments ago that has not been used', () => {
    expect(isBrandNewAccount(fresh, now)).toBe(true)
    expect(isBrandNewAccount({ ...fresh, createdAt: now }, now)).toBe(true)
    expect(
      isBrandNewAccount({ ...fresh, createdAt: minutesAgo(accountTypeChoiceMinutes) }, now),
    ).toBe(true)
  })

  it('refuses an account older than the choice window', () => {
    expect(
      isBrandNewAccount({ ...fresh, createdAt: minutesAgo(accountTypeChoiceMinutes + 1) }, now),
    ).toBe(false)
  })

  it('refuses an account created in the future, which only a wrong clock produces', () => {
    expect(isBrandNewAccount({ ...fresh, createdAt: minutesAgo(-1) }, now)).toBe(false)
  })

  it('refuses an account that finished onboarding or already holds records', () => {
    expect(isBrandNewAccount({ ...fresh, onboardingCompletedAt: minutesAgo(1) }, now)).toBe(false)
    expect(isBrandNewAccount({ ...fresh, records: 1 }, now)).toBe(false)
  })
})
