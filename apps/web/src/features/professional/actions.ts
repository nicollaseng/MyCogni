'use server'

import {
  createInvitationSchema,
  emergencyWhatsappSchema,
  updateProfessionalSchema,
  type CreatedInvitation,
  type RegisterProfessionalInput,
} from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { ApiError } from '@/shared/lib/api/client'
import {
  cancelInvitation,
  createInvitation,
  registerProfessional,
  resendInvitation,
  setEmergencyWhatsapp,
  updateProfessional,
} from '@/shared/lib/api/care'
import { grantConsents } from '@/shared/lib/api/resources'
import { forgetContinuePath } from '@/shared/lib/auth/continue-path'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { joinIssues, professionalConsentKinds, registrationInput, type JoinValues } from './join'
import type { InviteInput } from './invites'
import { photoStepFlag } from './onboarding'

const invitationId = z.uuid()

type Registered = 'registered' | 'taken'

async function register(input: RegisterProfessionalInput): Promise<Registered> {
  await grantConsents({ kinds: [...professionalConsentKinds] })
  try {
    await registerProfessional(input)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'REGISTRATION_TAKEN') {
      return 'taken'
    }
    if (!(error instanceof ApiError && error.status === 409)) {
      throw error
    }
  }
  return 'registered'
}

export async function joinAsProfessional(values: JoinValues): Promise<ActionResult<null>> {
  const t = await getTranslations('professional.form.errors')
  const [issue] = Object.values(joinIssues(values))
  if (issue !== undefined || values.kind === null) {
    return failure(t(issue ?? 'kindRequired'))
  }
  const input = registrationInput(values.kind, values)
  const result = await attempt(() => register(input), t('save'))
  if (!result.ok) {
    return result
  }
  if (result.value === 'taken') {
    return failure(t('registrationTaken'))
  }
  await forgetContinuePath()
  redirect('/pro')
}

export async function invite(input: InviteInput): Promise<ActionResult<CreatedInvitation>> {
  const [t, locale] = await Promise.all([getTranslations('professional.invites.form'), getLocale()])
  const parsed = createInvitationSchema.safeParse({ ...input, locale })
  if (!parsed.success) {
    return failure(t('invalidEmail'))
  }
  return attempt(async () => {
    const created = await createInvitation(parsed.data)
    revalidatePath('/pro/invites')
    revalidatePath('/pro')
    return created
  }, t('error'))
}

export async function resendInvite(id: string): Promise<ActionResult<CreatedInvitation>> {
  const [t, locale] = await Promise.all([getTranslations('professional.invites.sent'), getLocale()])
  if (!invitationId.safeParse(id).success) {
    return failure(t('error'))
  }
  return attempt(async () => {
    const created = await resendInvitation(id, locale)
    revalidatePath('/pro/invites')
    revalidatePath('/pro')
    return created
  }, t('error'))
}

export async function cancelInvite(id: string): Promise<ActionResult<null>> {
  const t = await getTranslations('professional.invites.sent')
  if (!invitationId.safeParse(id).success) {
    return failure(t('error'))
  }
  return attempt(async () => {
    await cancelInvitation(id)
    revalidatePath('/pro/invites')
    revalidatePath('/pro')
    return null
  }, t('error'))
}

export async function renameProfessional(fullName: string): Promise<ActionResult<string>> {
  const t = await getTranslations('professional.settings.profile')
  const parsed = updateProfessionalSchema.safeParse({ fullName })
  if (!parsed.success) {
    return failure(t('invalidName'))
  }
  return attempt(async () => {
    const updated = await updateProfessional(parsed.data)
    revalidatePath('/pro', 'layout')
    return updated.fullName
  }, t('error'))
}

export async function saveEmergencyWhatsapp(
  emergencyWhatsapp: string | null,
): Promise<ActionResult<string | null>> {
  const t = await getTranslations('professional.settings.whatsapp')
  const parsed = emergencyWhatsappSchema.safeParse({ emergencyWhatsapp })
  if (!parsed.success) {
    return failure(t('invalid'))
  }
  return attempt(async () => {
    const updated = await setEmergencyWhatsapp(parsed.data)
    revalidatePath('/pro/settings')
    return updated.emergencyWhatsapp
  }, t('error'))
}

export async function finishPhotoStep(): Promise<ActionResult<null>> {
  const t = await getTranslations('verification.photo')
  const supabase = await createSupabaseServerClient('read-write')
  const { error } = await supabase.auth.updateUser({ data: { [photoStepFlag]: true } })
  if (error !== null) {
    console.error(error)
    return failure(t('failed'))
  }
  revalidatePath('/pro', 'layout')
  return { ok: true, value: null }
}
