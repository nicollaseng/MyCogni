import { z } from 'zod'

export const emailSchema = z.email('Digite um email válido.')

export const newPasswordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .regex(/\p{L}/u, 'Use letras e números na senha.')
  .regex(/\d/, 'Use letras e números na senha.')

export const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'O código tem 6 números.')

export const signUpSchema = z.object({ email: emailSchema, password: newPasswordSchema })

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Digite sua senha.'),
})

export const verifySchema = z.object({ code: codeSchema })

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z.object({ code: codeSchema, password: newPasswordSchema })
