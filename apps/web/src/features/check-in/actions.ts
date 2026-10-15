'use server'

import { createCheckInSchema, type CheckIn, type CreateCheckInInput } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import type { SafetyPrompt } from '@/features/safety/model'
import { safetyPromptFor } from '@/features/safety/prompt'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { createCheckIn } from '@/shared/lib/api/resources'

export interface SavedCheckIn {
  checkIn: CheckIn
  safety: SafetyPrompt | null
}

export async function saveCheckIn(input: CreateCheckInInput): Promise<ActionResult<SavedCheckIn>> {
  const t = await getTranslations('checkIn.errors')
  const parsed = createCheckInSchema.safeParse(input)
  if (!parsed.success) {
    return failure(t('save'))
  }
  const result = await attempt(async () => {
    const { support, ...checkIn } = await createCheckIn(parsed.data)
    return { checkIn, safety: await safetyPromptFor(support.level) }
  }, t('save'))
  if (result.ok) {
    for (const path of ['/today', '/entries', '/patterns']) {
      revalidatePath(path)
    }
  }
  return result
}
