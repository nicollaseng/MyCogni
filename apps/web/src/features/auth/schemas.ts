import { z } from 'zod'
import type { AuthMessages } from '@/i18n/messages/pt-BR/auth'

export type ValidationKey = keyof AuthMessages['validation']

export type ValidationMessage = (key: ValidationKey) => string

export function emailSchema(message: ValidationMessage) {
  return z.email(message('email'))
}

export function newPasswordSchema(message: ValidationMessage) {
  return z
    .string()
    .min(8, message('passwordLength'))
    .regex(/\p{L}/u, message('passwordMix'))
    .regex(/\d/, message('passwordMix'))
}

export function codeSchema(message: ValidationMessage) {
  return z
    .string()
    .trim()
    .regex(/^\d{6}$/, message('code'))
}

export function authSchemas(message: ValidationMessage) {
  const email = emailSchema(message)
  const newPassword = newPasswordSchema(message)
  const code = codeSchema(message)
  return {
    signUp: z.object({ email, password: newPassword }),
    signIn: z.object({ email, password: z.string().min(1, message('password')) }),
    verify: z.object({ code }),
    forgotPassword: z.object({ email }),
    resetPassword: z.object({ code, password: newPassword }),
    newPassword: z.object({ password: newPassword }),
  }
}
