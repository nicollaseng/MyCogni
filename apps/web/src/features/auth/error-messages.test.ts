import { describe, expect, it } from '@jest/globals'
import { authErrorMessage, genericAuthError } from './error-messages'

describe('authErrorMessage', () => {
  it('explains the common auth errors in Portuguese', () => {
    expect(authErrorMessage('invalid_credentials')).toBe('Email ou senha incorretos.')
    expect(authErrorMessage('otp_expired')).toBe('O código expirou ou não confere. Peça um novo.')
    expect(authErrorMessage('weak_password')).toBe(
      'Escolha uma senha mais forte, com letras e números.',
    )
  })

  it('falls back to a neutral message for anything else', () => {
    expect(authErrorMessage('unexpected_failure')).toBe(genericAuthError)
    expect(authErrorMessage(undefined)).toBe(genericAuthError)
  })
})
