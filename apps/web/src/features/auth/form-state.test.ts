import { describe, expect, it } from '@jest/globals'
import { failed, initialFormState, invalidFields, noticed } from './form-state'
import { signUpSchema } from './schemas'

describe('form state', () => {
  it('keeps the first problem of each field', () => {
    const result = signUpSchema.safeParse({ email: 'ana', password: '1' })
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
