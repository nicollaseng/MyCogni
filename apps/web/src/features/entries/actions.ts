'use server'

import { createCheckInAddendumSchema, type CheckInAddendum } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { appendToCheckIn } from '@/shared/lib/api/resources'

export async function addToEntry(id: string, text: string): Promise<ActionResult<CheckInAddendum>> {
  const t = await getTranslations('entries.detail')
  const parsed = createCheckInAddendumSchema.safeParse({ text })
  if (!parsed.success) {
    return failure(t('error'))
  }
  const result = await attempt(() => appendToCheckIn(id, parsed.data), t('error'))
  if (result.ok) {
    revalidatePath('/entries')
    revalidatePath(`/entries/${id}`)
  }
  return result
}
