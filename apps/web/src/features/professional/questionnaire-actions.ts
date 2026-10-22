'use server'

import {
  createAssignmentSchema,
  type CreateAssignmentInput,
  type ProfessionalAssignment,
} from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { ApiError } from '@/shared/lib/api/client'
import { cancelAssignment, releaseQuestionnaire } from '@/shared/lib/api/questionnaires'

const id = z.uuid()

const errorKeys: Readonly<Record<string, 'open' | 'limit' | 'notAllowed' | 'language'>> = {
  QUESTIONNAIRE_ALREADY_OPEN: 'open',
  QUESTIONNAIRE_LIMIT: 'limit',
  QUESTIONNAIRE_NOT_ALLOWED: 'notAllowed',
  QUESTIONNAIRE_LANGUAGE_UNAVAILABLE: 'language',
}

function refresh(patientId: string): void {
  revalidatePath(`/pro/patients/${patientId}`, 'layout')
}

export async function releaseToPatient(
  patientId: string,
  input: CreateAssignmentInput,
): Promise<ActionResult<ProfessionalAssignment>> {
  const t = await getTranslations('assignments.dialog.errors')
  const parsed = createAssignmentSchema.safeParse(input)
  if (!id.safeParse(patientId).success || !parsed.success) {
    return failure(t('generic'))
  }
  try {
    const released = await releaseQuestionnaire(patientId, parsed.data)
    refresh(patientId)
    return { ok: true, value: released }
  } catch (cause) {
    const key = cause instanceof ApiError ? errorKeys[cause.code] : undefined
    if (key !== undefined) {
      return failure(t(key))
    }
    console.error(cause)
    return failure(t('generic'))
  }
}

export async function cancelForPatient(
  patientId: string,
  assignmentId: string,
): Promise<ActionResult<null>> {
  const t = await getTranslations('assignments.table')
  if (!id.safeParse(patientId).success || !id.safeParse(assignmentId).success) {
    return failure(t('error'))
  }
  try {
    await cancelAssignment(patientId, assignmentId)
    refresh(patientId)
    return { ok: true, value: null }
  } catch (cause) {
    console.error(cause)
    return failure(t('error'))
  }
}
