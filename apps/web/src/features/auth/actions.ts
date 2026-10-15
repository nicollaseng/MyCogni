'use server'

import { redirect } from 'next/navigation'
import { serverEnv } from '@/shared/lib/env'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { authErrorMessage, genericAuthError } from './error-messages'
import { failed, invalidFields, noticed, type FormState } from './form-state'
import { forgetPendingEmail, pendingEmail, rememberPendingEmail } from './pending-email'
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifySchema,
} from './schemas'

const homePath = '/today'

type ExternalUrl = `${string}:${string}`

function isExternalUrl(value: string): value is ExternalUrl {
  return /^https?:\/\//.test(value)
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

async function requirePendingEmail(): Promise<string> {
  const email = await pendingEmail()
  if (email === null) {
    redirect('/sign-up')
  }
  return email
}

export async function signUp(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    email: field(formData, 'email'),
    password: field(formData, 'password'),
  })
  if (!parsed.success) {
    return invalidFields(parsed.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  const { error } = await supabase.auth.signUp(parsed.data)
  if (error !== null) {
    return failed(authErrorMessage(error.code))
  }
  await rememberPendingEmail(parsed.data.email)
  redirect('/verify')
}

export async function verifyEmail(_state: FormState, formData: FormData): Promise<FormState> {
  const email = await requirePendingEmail()
  const parsed = verifySchema.safeParse({ code: field(formData, 'code') })
  if (!parsed.success) {
    return invalidFields(parsed.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  const { error } = await supabase.auth.verifyOtp({ email, token: parsed.data.code, type: 'email' })
  if (error !== null) {
    return failed(authErrorMessage(error.code))
  }
  await forgetPendingEmail()
  redirect(homePath)
}

export async function resendCode(): Promise<FormState> {
  const email = await requirePendingEmail()
  const supabase = await createSupabaseServerClient('read-write')
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error !== null) {
    return failed(authErrorMessage(error.code))
  }
  return noticed('Enviamos um novo código.')
}

export async function signIn(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: field(formData, 'email'),
    password: field(formData, 'password'),
  })
  if (!parsed.success) {
    return invalidFields(parsed.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error?.code === 'email_not_confirmed') {
    await supabase.auth.resend({ type: 'signup', email: parsed.data.email })
    await rememberPendingEmail(parsed.data.email)
    redirect('/verify')
  }
  if (error !== null) {
    return failed(authErrorMessage(error.code))
  }
  redirect(homePath)
}

export async function signInWithGoogle(): Promise<FormState> {
  const supabase = await createSupabaseServerClient('read-write')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${serverEnv().siteUrl}/auth/callback` },
  })
  if (error !== null) {
    return failed(authErrorMessage(error.code))
  }
  if (!isExternalUrl(data.url)) {
    return failed(genericAuthError)
  }
  redirect(data.url)
}

export async function requestPasswordReset(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: field(formData, 'email') })
  if (!parsed.success) {
    return invalidFields(parsed.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email)
  if (error !== null && error.code !== 'user_not_found') {
    return failed(authErrorMessage(error.code))
  }
  await rememberPendingEmail(parsed.data.email)
  redirect('/reset-password')
}

export async function resetPassword(_state: FormState, formData: FormData): Promise<FormState> {
  const email = await requirePendingEmail()
  const parsed = resetPasswordSchema.safeParse({
    code: field(formData, 'code'),
    password: field(formData, 'password'),
  })
  if (!parsed.success) {
    return invalidFields(parsed.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  const verified = await supabase.auth.verifyOtp({
    email,
    token: parsed.data.code,
    type: 'recovery',
  })
  if (verified.error !== null) {
    return failed(authErrorMessage(verified.error.code))
  }
  const updated = await supabase.auth.updateUser({ password: parsed.data.password })
  if (updated.error !== null) {
    return failed(authErrorMessage(updated.error.code))
  }
  await forgetPendingEmail()
  redirect(homePath)
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient('read-write')
  await supabase.auth.signOut()
  redirect('/')
}
