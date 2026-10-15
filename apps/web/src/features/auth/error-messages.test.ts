import { describe, expect, it } from '@jest/globals'
import { createTranslator } from 'next-intl'
import { messagesFor } from '@/i18n/messages'
import { authErrorKey, isExistingAccount } from './error-messages'

const portuguese = createTranslator({
  locale: 'pt-BR',
  messages: messagesFor('pt-BR'),
  namespace: 'auth.errors',
})

describe('authErrorKey', () => {
  it('explains the common auth errors in Portuguese', () => {
    expect(portuguese(authErrorKey('invalid_credentials'))).toBe('Email ou senha incorretos.')
    expect(portuguese(authErrorKey('otp_expired'))).toBe(
      'O código expirou ou não confere. Peça um novo.',
    )
    expect(portuguese(authErrorKey('weak_password'))).toBe(
      'Escolha uma senha mais forte, com letras e números.',
    )
  })

  it('uses the same message for both ways of saying the account exists', () => {
    expect(authErrorKey('user_already_exists')).toBe('accountExists')
    expect(authErrorKey('email_exists')).toBe('accountExists')
  })

  it('falls back to a neutral message for anything else', () => {
    expect(authErrorKey('unexpected_failure')).toBe('generic')
    expect(authErrorKey(undefined)).toBe('generic')
  })

  it('explains the errors in the visitor language', () => {
    const english = createTranslator({
      locale: 'en-US',
      messages: messagesFor('en-US'),
      namespace: 'auth.errors',
    })

    expect(english(authErrorKey('invalid_credentials'))).toBe('Incorrect email or password.')
  })
})

describe('isExistingAccount', () => {
  it('recognises the empty identity list hosted sign-up returns for an email that already has an account', () => {
    expect(isExistingAccount({ identities: [] })).toBe(true)
    expect(isExistingAccount({ identities: [{ provider: 'email' }] })).toBe(false)
    expect(isExistingAccount({})).toBe(false)
    expect(isExistingAccount(null)).toBe(false)
  })
})
