import { describe, expect, it } from '@jest/globals'
import { codeSchema, newPasswordSchema, signUpSchema } from './schemas'

function messageOf(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('auth schemas', () => {
  it('accepts an email and a password with letters and numbers', () => {
    expect(
      signUpSchema.safeParse({ email: 'ana@exemplo.com', password: 'senha2026' }).success,
    ).toBe(true)
  })

  it('asks for at least 8 characters', () => {
    expect(messageOf(newPasswordSchema.safeParse('abc123'))).toBe(
      'A senha precisa ter pelo menos 8 caracteres.',
    )
  })

  it('asks for letters and numbers together', () => {
    expect(messageOf(newPasswordSchema.safeParse('12345678'))).toBe(
      'Use letras e números na senha.',
    )
    expect(messageOf(newPasswordSchema.safeParse('somenteletras'))).toBe(
      'Use letras e números na senha.',
    )
  })

  it('accepts accented letters in the password', () => {
    expect(newPasswordSchema.safeParse('coração2026').success).toBe(true)
  })

  it('expects a code of exactly six numbers', () => {
    expect(codeSchema.safeParse(' 123456 ').success).toBe(true)
    expect(messageOf(codeSchema.safeParse('12345'))).toBe('O código tem 6 números.')
    expect(messageOf(codeSchema.safeParse('12a456'))).toBe('O código tem 6 números.')
  })

  it('rejects an invalid email', () => {
    expect(messageOf(signUpSchema.safeParse({ email: 'ana', password: 'senha2026' }))).toBe(
      'Digite um email válido.',
    )
  })
})
