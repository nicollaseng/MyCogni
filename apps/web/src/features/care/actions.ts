'use server'

import {
  acceptInvitationSchema,
  invitationCodeSchema,
  markNotificationsReadSchema,
  type AcceptInvitationInput,
} from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import {
  acceptInvitation,
  claimInvitation,
  declineInvitation,
  endCareLink,
  fetchReceivedInvitation,
  markNotificationsRead,
} from '@/shared/lib/api/care'
import { ApiError } from '@/shared/lib/api/client'
import { forgetContinuePath } from '@/shared/lib/auth/continue-path'

type Outcome<T> = { ok: true; value: T } | { ok: false; status: number | null }

async function settle<T>(work: () => Promise<T>): Promise<Outcome<T>> {
  try {
    return { ok: true, value: await work() }
  } catch (cause) {
    if (cause instanceof ApiError && cause.status < 500) {
      return { ok: false, status: cause.status }
    }
    console.error(cause)
    return { ok: false, status: null }
  }
}

function refreshApp(): void {
  revalidatePath('/', 'layout')
}

async function conflictMessage(id: string): Promise<string> {
  const [t, invitation] = await Promise.all([
    getTranslations('care.feedback'),
    fetchReceivedInvitation(id).catch(() => null),
  ])
  return invitation?.status === 'pending'
    ? t('alreadyLinked', { name: invitation.professional.name })
    : t('notPending')
}

export async function claimInvite(code: string): Promise<ActionResult<null>> {
  const t = await getTranslations('care.feedback')
  const parsed = invitationCodeSchema.safeParse(code)
  if (!parsed.success) {
    return failure(t('unavailable'))
  }
  const claimed = await settle(() => claimInvitation(parsed.data))
  if (!claimed.ok) {
    return failure(claimed.status === 404 ? t('unavailable') : t('error'))
  }
  refreshApp()
  redirect(`/invites/${claimed.value.id}`)
}

export async function acceptInvite(
  id: string,
  input: AcceptInvitationInput,
): Promise<ActionResult<null>> {
  const t = await getTranslations('care.feedback')
  const parsed = acceptInvitationSchema.safeParse(input)
  if (!parsed.success) {
    return failure(t('error'))
  }
  const accepted = await settle(() => acceptInvitation(id, parsed.data))
  if (!accepted.ok) {
    if (accepted.status === 409) {
      return failure(await conflictMessage(id))
    }
    return failure(accepted.status === 404 ? t('unavailable') : t('error'))
  }
  await forgetContinuePath()
  refreshApp()
  redirect('/me#professionals')
}

export async function declineInvite(id: string): Promise<ActionResult<null>> {
  const t = await getTranslations('care.feedback')
  const declined = await settle(() => declineInvitation(id))
  if (!declined.ok) {
    return failure(declined.status === 409 ? t('notPending') : t('error'))
  }
  await forgetContinuePath()
  refreshApp()
  redirect('/invites')
}

export async function endLink(id: string): Promise<ActionResult<null>> {
  const t = await getTranslations('care.feedback')
  const ended = await settle(() => endCareLink(id))
  if (!ended.ok && ended.status !== 404) {
    return failure(t('endError'))
  }
  revalidatePath('/me')
  return { ok: true, value: null }
}

export async function readNotifications(ids: string[]): Promise<ActionResult<null>> {
  const t = await getTranslations('care.feedback')
  const parsed = markNotificationsReadSchema.safeParse({ ids })
  if (!parsed.success) {
    return failure(t('error'))
  }
  const read = await settle(() => markNotificationsRead(parsed.data.ids))
  if (!read.ok) {
    return failure(t('error'))
  }
  refreshApp()
  return { ok: true, value: null }
}
