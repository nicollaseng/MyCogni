'use server'

import { createCheckInSchema, type CheckIn, type CreateCheckInInput } from '@mycogni/contracts'
import { getTranslations } from 'next-intl/server'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { createCheckIn } from '@/shared/lib/api/resources'

export async function saveCheckIn(input: CreateCheckInInput): Promise<ActionResult<CheckIn>> {
  const t = await getTranslations('checkIn.errors')
  const parsed = createCheckInSchema.safeParse(input)
  if (!parsed.success) {
    return failure(t('save'))
  }
  return attempt(() => createCheckIn(parsed.data), t('save'))
}
