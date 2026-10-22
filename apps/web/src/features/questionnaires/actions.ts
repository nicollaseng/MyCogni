'use server'

import { answerQuestionnaireSchema, type QuestionnaireRun } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { ApiError } from '@/shared/lib/api/client'
import {
  answerQuestionnaire,
  completeQuestionnaire,
  startQuestionnaire,
} from '@/shared/lib/api/questionnaires'

const runId = z.uuid()

async function run(
  id: string,
  work: () => Promise<QuestionnaireRun>,
): Promise<ActionResult<QuestionnaireRun>> {
  const t = await getTranslations('questionnaires.errors')
  if (!runId.safeParse(id).success) {
    return failure(t('save'))
  }
  try {
    return { ok: true, value: await work() }
  } catch (cause) {
    if (cause instanceof ApiError && cause.code === 'QUESTIONNAIRE_LANGUAGE_UNAVAILABLE') {
      return failure(t('language'))
    }
    if (cause instanceof ApiError && cause.code === 'QUESTIONNAIRE_CLOSED') {
      return failure(t('closed'))
    }
    console.error(cause)
    return failure(t('save'))
  }
}

export async function beginQuestionnaire(id: string): Promise<ActionResult<QuestionnaireRun>> {
  const locale = await getLocale()
  return run(id, () => startQuestionnaire(id, locale))
}

export async function saveAnswer(
  id: string,
  item: number,
  value: number,
): Promise<ActionResult<QuestionnaireRun>> {
  const parsed = answerQuestionnaireSchema.safeParse({ item, value })
  if (!parsed.success) {
    return failure((await getTranslations('questionnaires.errors'))('save'))
  }
  return run(id, () => answerQuestionnaire(id, parsed.data.item, parsed.data.value))
}

export async function finishQuestionnaire(id: string): Promise<ActionResult<QuestionnaireRun>> {
  const result = await run(id, () => completeQuestionnaire(id))
  if (result.ok) {
    revalidatePath('/today')
    revalidatePath('/me/questionnaires')
  }
  return result
}
