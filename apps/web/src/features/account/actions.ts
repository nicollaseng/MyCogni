'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { authErrorKey } from '@/features/auth/error-messages'
import { emailSchema, newPasswordSchema } from '@/features/auth/schemas'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import {
  deleteAccount,
  fetchProfile,
  grantConsents,
  revokeConsent,
  updateProfile,
} from '@/shared/lib/api/resources'
import { serverEnv } from '@/shared/lib/env'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { avatarBucket, avatarExtension, avatarMaxBytes } from './avatar'

const nameMaxLength = 80

function firstIssue(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

export async function renameMe(displayName: string): Promise<ActionResult<string>> {
  const t = await getTranslations('account.feedback')
  const nameSchema = z
    .string()
    .trim()
    .min(1, t('nameRequired'))
    .max(nameMaxLength, t('nameTooLong', { max: nameMaxLength }))
  const parsed = nameSchema.safeParse(displayName)
  if (!parsed.success) {
    return failure(firstIssue(parsed.error, t('saveError')))
  }
  return attempt(async () => {
    await updateProfile({ displayName: parsed.data })
    revalidatePath('/me')
    return t('nameSaved')
  }, t('saveError'))
}

export async function changeEmail(email: string): Promise<ActionResult<string>> {
  const [t, validation, authErrors] = await Promise.all([
    getTranslations('account.feedback'),
    getTranslations('auth.validation'),
    getTranslations('auth.errors'),
  ])
  const parsed = emailSchema(validation).safeParse(email.trim())
  if (!parsed.success) {
    return failure(firstIssue(parsed.error, t('saveError')))
  }
  const supabase = await createSupabaseServerClient('read-write')
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data },
    { emailRedirectTo: `${serverEnv().siteUrl}/auth/callback` },
  )
  if (error !== null) {
    return failure(authErrors(authErrorKey(error.code)))
  }
  return { ok: true, value: t('emailSent') }
}

export async function changePassword(input: {
  current: string
  next: string
}): Promise<ActionResult<string>> {
  const [t, validation, authErrors] = await Promise.all([
    getTranslations('account.feedback'),
    getTranslations('auth.validation'),
    getTranslations('auth.errors'),
  ])
  const parsed = newPasswordSchema(validation).safeParse(input.next)
  if (!parsed.success) {
    return failure(firstIssue(parsed.error, t('saveError')))
  }
  const supabase = await createSupabaseServerClient('read-write')
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims.email
  if (typeof email !== 'string') {
    return failure(t('saveError'))
  }
  const verified = await supabase.auth.signInWithPassword({ email, password: input.current })
  if (verified.error !== null) {
    return failure(t('wrongPassword'))
  }
  const updated = await supabase.auth.updateUser({ password: parsed.data })
  if (updated.error !== null) {
    return failure(authErrors(authErrorKey(updated.error.code)))
  }
  return { ok: true, value: t('passwordChanged') }
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<string>> {
  const t = await getTranslations('account.feedback')
  const file = formData.get('photo')
  const extension = file instanceof File ? avatarExtension(file.type) : null
  if (!(file instanceof File) || extension === null || file.size > avatarMaxBytes) {
    return failure(t('photoInvalid'))
  }
  const profile = await fetchProfile()
  const path = `${profile.id}/avatar-${String(Date.now())}.${extension}`
  const storage = (await createSupabaseServerClient('read-write')).storage.from(avatarBucket)
  const uploaded = await storage.upload(path, file, { contentType: file.type })
  if (uploaded.error !== null) {
    return failure(t('saveError'))
  }
  const saved = await attempt(() => updateProfile({ avatarPath: path }), t('saveError'))
  if (!saved.ok) {
    await storage.remove([path])
    return failure(saved.error)
  }
  if (profile.avatarPath !== null) {
    await storage.remove([profile.avatarPath])
  }
  revalidatePath('/me')
  return { ok: true, value: t('photoSaved') }
}

export async function removeAvatar(): Promise<ActionResult<string>> {
  const t = await getTranslations('account.feedback')
  const profile = await fetchProfile()
  if (profile.avatarPath === null) {
    return { ok: true, value: t('photoRemoved') }
  }
  const saved = await attempt(() => updateProfile({ avatarPath: null }), t('saveError'))
  if (!saved.ok) {
    return failure(saved.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  await supabase.storage.from(avatarBucket).remove([profile.avatarPath])
  revalidatePath('/me')
  return { ok: true, value: t('photoRemoved') }
}

export async function deleteMyAccount(confirmation: string): Promise<ActionResult<null>> {
  const t = await getTranslations('account')
  const word = t('delete.word')
  if (confirmation.trim().toUpperCase() !== word) {
    return failure(t('feedback.typeWord', { word }))
  }
  const deleted = await attempt(deleteAccount, t('feedback.deleteError'))
  if (!deleted.ok) {
    return failure(deleted.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/')
}

export async function setAiConsent(enabled: boolean): Promise<ActionResult<string>> {
  const t = await getTranslations('account.feedback')
  const result = await attempt(async () => {
    if (enabled) {
      await grantConsents({ kinds: ['ai_processing'] })
    } else {
      await revokeConsent('ai_processing')
    }
    return enabled ? t('aiOn') : t('aiOff')
  }, t('saveError'))
  if (result.ok) {
    revalidatePath('/me')
  }
  return result
}

export async function setJournalInInsights(enabled: boolean): Promise<ActionResult<string>> {
  const t = await getTranslations('account.feedback')
  const result = await attempt(async () => {
    await updateProfile({ journalInInsights: enabled })
    return enabled ? t('journalOn') : t('journalOff')
  }, t('saveError'))
  if (result.ok) {
    revalidatePath('/me')
  }
  return result
}
