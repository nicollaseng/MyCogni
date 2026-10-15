'use server'

import { createCheckInAddendumSchema, type CheckInAddendum } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import type { SafetyPrompt } from '@/features/safety/model'
import { safetyPromptFor } from '@/features/safety/prompt'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { appendToCheckIn } from '@/shared/lib/api/resources'

export interface SavedAddendum {
  addendum: CheckInAddendum
  safety: SafetyPrompt | null
}

export async function addToEntry(id: string, text: string): Promise<ActionResult<SavedAddendum>> {
  const t = await getTranslations('entries.detail')
  const parsed = createCheckInAddendumSchema.safeParse({ text })
  if (!parsed.success) {
    return failure(t('error'))
  }
  const result = await attempt(async () => {
    const { support, ...addendum } = await appendToCheckIn(id, parsed.data)
    return { addendum, safety: await safetyPromptFor(support.level) }
  }, t('error'))
  if (result.ok) {
    revalidatePath('/entries')
    revalidatePath(`/entries/${id}`)
  }
  return result
}
