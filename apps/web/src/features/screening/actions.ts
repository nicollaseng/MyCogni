'use server'

import { submitAssessmentSchema, type Assessment } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { submitAssessment } from '@/shared/lib/api/resources'
import type { ScreeningInput } from './model'

export async function submitScreening(input: ScreeningInput): Promise<ActionResult<Assessment>> {
  const t = await getTranslations('screening.errors')
  const parsed = submitAssessmentSchema.safeParse(input)
  if (!parsed.success) {
    return failure(t('save'))
  }
  const result = await attempt(() => submitAssessment(parsed.data), t('save'))
  if (result.ok) {
    revalidatePath('/me')
    revalidatePath('/today')
    revalidatePath('/zen')
  }
  return result
}
