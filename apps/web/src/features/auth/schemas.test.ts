import { describe, expect, it } from '@jest/globals'
import { createTranslator } from 'next-intl'
import { messagesFor } from '@/i18n/messages'
import { authSchemas, codeSchema, newPasswordSchema } from './schemas'

const message = createTranslator({
  locale: 'pt-BR',
  messages: messagesFor('pt-BR'),
  namespace: 'auth.validation',
})

const schemas = authSchemas(message)

function messageOf(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('auth schemas', () => {
  it('accepts an email and a password with letters and numbers', () => {
    expect(
      schemas.signUp.safeParse({ email: 'ana@exemplo.com', password: 'senha2026' }).success,
    ).toBe(true)
  })

  it('asks for at least 8 characters', () => {
    expect(messageOf(newPasswordSchema(message).safeParse('abc123'))).toBe(
      'A senha precisa ter pelo menos 8 caracteres.',
    )
  })

  it('asks for letters and numbers together', () => {
    expect(messageOf(newPasswordSchema(message).safeParse('12345678'))).toBe(
      'Use letras e números na senha.',
    )
    expect(messageOf(newPasswordSchema(message).safeParse('somenteletras'))).toBe(
      'Use letras e números na senha.',
    )
  })

  it('accepts accented letters in the password', () => {
    expect(newPasswordSchema(message).safeParse('coração2026').success).toBe(true)
  })

  it('expects a code of exactly six numbers', () => {
    expect(codeSchema(message).safeParse(' 123456 ').success).toBe(true)
    expect(messageOf(codeSchema(message).safeParse('12345'))).toBe('O código tem 6 números.')
    expect(messageOf(codeSchema(message).safeParse('12a456'))).toBe('O código tem 6 números.')
  })

  it('rejects an invalid email', () => {
    expect(messageOf(schemas.signUp.safeParse({ email: 'ana', password: 'senha2026' }))).toBe(
      'Digite um email válido.',
    )
  })

  it('asks for the password when signing in', () => {
    expect(messageOf(schemas.signIn.safeParse({ email: 'ana@exemplo.com', password: '' }))).toBe(
      'Digite sua senha.',
    )
  })

  it('checks only the strength of the password chosen after the recovery link', () => {
    expect(schemas.newPassword.safeParse({ password: 'nova-senha-2026' }).success).toBe(true)
    expect(messageOf(schemas.newPassword.safeParse({ password: 'somenteletras' }))).toBe(
      'Use letras e números na senha.',
    )
  })

  it('explains the problems in the visitor language', () => {
    const european = authSchemas(
      createTranslator({
        locale: 'pt-PT',
        messages: messagesFor('pt-PT'),
        namespace: 'auth.validation',
      }),
    )

    expect(messageOf(european.newPassword.safeParse({ password: 'curta' }))).toBe(
      'A palavra-passe tem de ter pelo menos 8 caracteres.',
    )
  })
})
