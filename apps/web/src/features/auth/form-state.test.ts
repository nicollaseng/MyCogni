import { describe, expect, it } from '@jest/globals'
import { createTranslator } from 'next-intl'
import { messagesFor } from '@/i18n/messages'
import { failed, initialFormState, invalidFields, noticed } from './form-state'
import { authSchemas } from './schemas'

const { signUp } = authSchemas(
  createTranslator({
    locale: 'pt-BR',
    messages: messagesFor('pt-BR'),
    namespace: 'auth.validation',
  }),
)

describe('form state', () => {
  it('keeps the first problem of each field', () => {
    const result = signUp.safeParse({ email: 'ana', password: '1' })
    if (result.success) {
      throw new Error('Expected the payload to be invalid')
    }

    expect(invalidFields(result.error)).toEqual({
      error: null,
      notice: null,
      fieldErrors: {
        email: 'Digite um email válido.',
        password: 'A senha precisa ter pelo menos 8 caracteres.',
      },
    })
  })

  it('separates errors from notices', () => {
    expect(failed('Algo deu errado.')).toEqual({ ...initialFormState, error: 'Algo deu errado.' })
    expect(noticed('Enviamos um novo código.')).toEqual({
      ...initialFormState,
      notice: 'Enviamos um novo código.',
    })
  })
})
