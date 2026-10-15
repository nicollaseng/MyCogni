'use server'

import {
  changeSupportStatusSchema,
  reviewProfessionalSchema,
  type AdminSupportTicket,
} from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { reviewProfessional } from '@/shared/lib/api/care'
import { changeSupportStatus } from '@/shared/lib/api/support'

const professionalId = z.uuid()

const ticketId = z.uuid()

export async function reviewAs(userId: string, input: unknown): Promise<ActionResult<null>> {
  const t = await getTranslations('admin.professionals')
  const id = professionalId.safeParse(userId)
  const review = reviewProfessionalSchema.safeParse(input)
  if (!id.success || !review.success) {
    return failure(t(review.success ? 'error' : 'rejectForm.required'))
  }
  return attempt(async () => {
    await reviewProfessional(id.data, review.data)
    revalidatePath('/admin/professionals')
    return null
  }, t('error'))
}

export async function changeTicketStatus(
  id: string,
  input: unknown,
): Promise<ActionResult<AdminSupportTicket>> {
  const t = await getTranslations('admin.support.actions')
  const ticket = ticketId.safeParse(id)
  const change = changeSupportStatusSchema.safeParse(input)
  if (!ticket.success || !change.success) {
    return failure(t('error'))
  }
  return attempt(async () => {
    const updated = await changeSupportStatus(ticket.data, change.data)
    revalidatePath('/admin/support', 'layout')
    return updated
  }, t('error'))
}
