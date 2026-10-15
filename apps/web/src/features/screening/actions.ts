'use server'

import { submitAssessmentSchema, type Assessment } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { submitAssessment } from '@/shared/lib/api/resources'
import type { ScreeningInput } from './model'

const saveError = 'Não conseguimos salvar suas respostas agora. Tente de novo em instantes.'

export async function submitScreening(input: ScreeningInput): Promise<ActionResult<Assessment>> {
  const parsed = submitAssessmentSchema.safeParse(input)
  if (!parsed.success) {
    return failure(saveError)
  }
  const result = await attempt(() => submitAssessment(parsed.data), saveError)
  if (result.ok) {
    revalidatePath('/me')
    revalidatePath('/today')
  }
  return result
}
