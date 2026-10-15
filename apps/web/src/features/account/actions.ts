'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { authErrorMessage } from '@/features/auth/error-messages'
import { emailSchema, newPasswordSchema } from '@/features/auth/schemas'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { deleteAccount, fetchProfile, updateProfile } from '@/shared/lib/api/resources'
import { serverEnv } from '@/shared/lib/env'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { avatarBucket, avatarExtension, avatarMaxBytes } from './avatar'

const saveError = 'Não conseguimos salvar agora. Tente de novo em instantes.'

const nameSchema = z.string().trim().min(1, 'Digite um nome.').max(80, 'Use até 80 caracteres.')

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? saveError
}

export async function renameMe(displayName: string): Promise<ActionResult<string>> {
  const parsed = nameSchema.safeParse(displayName)
  if (!parsed.success) {
    return failure(firstIssue(parsed.error))
  }
  return attempt(async () => {
    await updateProfile({ displayName: parsed.data })
    revalidatePath('/me')
    return 'Nome atualizado.'
  }, saveError)
}

export async function changeEmail(email: string): Promise<ActionResult<string>> {
  const parsed = emailSchema.safeParse(email.trim())
  if (!parsed.success) {
    return failure(firstIssue(parsed.error))
  }
  const supabase = await createSupabaseServerClient('read-write')
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data },
    { emailRedirectTo: `${serverEnv().siteUrl}/auth/callback` },
  )
  if (error !== null) {
    return failure(authErrorMessage(error.code))
  }
  return {
    ok: true,
    value: 'Enviamos um link para o novo email. A troca vale depois que você confirmar.',
  }
}

export async function changePassword(input: {
  current: string
  next: string
}): Promise<ActionResult<string>> {
  const parsed = newPasswordSchema.safeParse(input.next)
  if (!parsed.success) {
    return failure(firstIssue(parsed.error))
  }
  const supabase = await createSupabaseServerClient('read-write')
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims.email
  if (typeof email !== 'string') {
    return failure(saveError)
  }
  const verified = await supabase.auth.signInWithPassword({ email, password: input.current })
  if (verified.error !== null) {
    return failure('A senha atual não confere.')
  }
  const updated = await supabase.auth.updateUser({ password: parsed.data })
  if (updated.error !== null) {
    return failure(authErrorMessage(updated.error.code))
  }
  return { ok: true, value: 'Senha alterada.' }
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<string>> {
  const file = formData.get('photo')
  const extension = file instanceof File ? avatarExtension(file.type) : null
  if (!(file instanceof File) || extension === null || file.size > avatarMaxBytes) {
    return failure('Use uma imagem JPG, PNG ou WebP de até 2 MB.')
  }
  const profile = await fetchProfile()
  const path = `${profile.id}/avatar-${String(Date.now())}.${extension}`
  const storage = (await createSupabaseServerClient('read-write')).storage.from(avatarBucket)
  const uploaded = await storage.upload(path, file, { contentType: file.type })
  if (uploaded.error !== null) {
    return failure(saveError)
  }
  const saved = await attempt(() => updateProfile({ avatarPath: path }), saveError)
  if (!saved.ok) {
    await storage.remove([path])
    return failure(saved.error)
  }
  if (profile.avatarPath !== null) {
    await storage.remove([profile.avatarPath])
  }
  revalidatePath('/me')
  return { ok: true, value: 'Foto atualizada.' }
}

export async function removeAvatar(): Promise<ActionResult<string>> {
  const profile = await fetchProfile()
  if (profile.avatarPath === null) {
    return { ok: true, value: 'Foto removida.' }
  }
  const saved = await attempt(() => updateProfile({ avatarPath: null }), saveError)
  if (!saved.ok) {
    return failure(saved.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  await supabase.storage.from(avatarBucket).remove([profile.avatarPath])
  revalidatePath('/me')
  return { ok: true, value: 'Foto removida.' }
}

export async function deleteMyAccount(confirmation: string): Promise<ActionResult<null>> {
  if (confirmation.trim().toUpperCase() !== 'EXCLUIR') {
    return failure('Digite EXCLUIR para confirmar.')
  }
  const deleted = await attempt(
    deleteAccount,
    'Não conseguimos excluir sua conta agora. Tente de novo em instantes.',
  )
  if (!deleted.ok) {
    return failure(deleted.error)
  }
  const supabase = await createSupabaseServerClient('read-write')
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/')
}
