'use server'

import {
  createInvitationSchema,
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
} from '@/shared/lib/api/care'
import { grantConsents } from '@/shared/lib/api/resources'
import { forgetContinuePath } from '@/shared/lib/auth/continue-path'
import { joinIssues, professionalConsentKinds, registrationInput, type JoinValues } from './join'
import type { InviteInput } from './invites'

const invitationId = z.uuid()

async function register(input: RegisterProfessionalInput): Promise<null> {
  await grantConsents({ kinds: [...professionalConsentKinds] })
  try {
    await registerProfessional(input)
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 409)) {
      throw error
    }
  }
  return null
}

export async function joinAsProfessional(values: JoinValues): Promise<ActionResult<null>> {
  const t = await getTranslations('professional.form.errors')
  const [issue] = Object.values(joinIssues(values))
  if (issue !== undefined || values.kind === null) {
    return failure(t(issue ?? 'kindRequired'))
  }
  const input = registrationInput(values.kind, values)
  const result = await attempt(() => register(input), t('save'))
  if (result.ok) {
    await forgetContinuePath()
    redirect('/pro')
  }
  return result
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
    return null
  }, t('error'))
}
