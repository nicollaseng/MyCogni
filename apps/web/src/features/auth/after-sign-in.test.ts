import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { AccountType } from '@mycogni/domain'
import { ApiError } from '@/shared/lib/api/client'
import type * as SignIn from './after-sign-in'

const jar = new Map<string, string>()

const account: { type: AccountType } = { type: 'patient' }

const attachInvitations = jest.fn<() => Promise<number>>()

const adoptProfessionalAccount = jest.fn<() => Promise<AccountType>>()

jest.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => {
        const value = jar.get(name)
        return value === undefined ? undefined : { name, value }
      },
      has: (name: string) => jar.has(name),
      set: (name: string, value: string) => {
        jar.set(name, value)
      },
      delete: (name: string) => {
        jar.delete(name)
      },
    }),
}))

jest.mock('@/shared/lib/api/care', () => ({
  attachInvitations: () => attachInvitations(),
}))

jest.mock('@/shared/lib/api/resources', () => ({
  fetchProfile: () => Promise.resolve({ accountType: account.type }),
  adoptProfessionalAccount: () => adoptProfessionalAccount(),
}))

let signIn: typeof SignIn

beforeAll(async () => {
  signIn = await import('./after-sign-in')
})

function visitProfessionalPage(): void {
  jar.set('MYCOGNI_CONTINUE', '/pro/join')
}

describe('after signing in', () => {
  beforeEach(() => {
    jar.clear()
    account.type = 'patient'
    attachInvitations.mockResolvedValue(0)
    adoptProfessionalAccount.mockResolvedValue('professional')
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    attachInvitations.mockReset()
    adoptProfessionalAccount.mockReset()
  })

  it('takes a patient to today even after a visit to the professional page', async () => {
    visitProfessionalPage()

    expect(await signIn.afterSignIn()).toBe('/today')
    expect(jar.has('MYCOGNI_CONTINUE')).toBe(false)
    expect(attachInvitations).toHaveBeenCalledTimes(1)
  })

  it('reads the continue cookie only once', async () => {
    jar.set('MYCOGNI_CONTINUE', '/invite/K7M2X9QA')

    expect(await signIn.afterSignIn()).toBe('/invite/K7M2X9QA')
    expect(await signIn.afterSignIn()).toBe('/today')
  })

  it('continues a professional to the registration and never attaches invitations', async () => {
    account.type = 'professional'
    visitProfessionalPage()

    expect(await signIn.afterSignIn()).toBe('/pro/join')
    expect(await signIn.afterSignIn()).toBe('/pro')
    expect(attachInvitations).not.toHaveBeenCalled()
  })

  it('never retypes an account after an email sign in', async () => {
    visitProfessionalPage()

    await signIn.afterSignIn()

    expect(adoptProfessionalAccount).not.toHaveBeenCalled()
  })

  it('turns a brand-new Google account into a professional when it came from the professional page', async () => {
    visitProfessionalPage()

    expect(await signIn.afterOAuthSignIn()).toBe('/pro/join')
    expect(adoptProfessionalAccount).toHaveBeenCalledTimes(1)
    expect(attachInvitations).not.toHaveBeenCalled()
  })

  it('keeps an existing Google patient a patient when the account can no longer change', async () => {
    adoptProfessionalAccount.mockRejectedValue(
      new ApiError(409, 'ACCOUNT_TYPE_LOCKED', 'The account type was already set'),
    )
    visitProfessionalPage()

    expect(await signIn.afterOAuthSignIn()).toBe('/today')
    expect(attachInvitations).toHaveBeenCalledTimes(1)
  })

  it('asks for no change when a Google sign in did not come from the professional page', async () => {
    expect(await signIn.afterOAuthSignIn()).toBe('/today')
    expect(adoptProfessionalAccount).not.toHaveBeenCalled()
  })
})
