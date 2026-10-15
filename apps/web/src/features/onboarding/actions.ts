'use server'

import {
  grantConsentsSchema,
  submitAssessmentSchema,
  updateProfileSchema,
  type Assessment,
} from '@mycogni/contracts'
import type { ConsentKind } from '@mycogni/domain'
import { redirect } from 'next/navigation'
import {
  completeOnboarding,
  grantConsents,
  submitAssessment,
  updateProfile,
} from '@/shared/lib/api/resources'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { saveError } from './copy'
import type { NameInput, ScreeningInput } from './model'

const invalid = failure(saveError)

export async function acceptConsents(kinds: ConsentKind[]): Promise<ActionResult<null>> {
  const parsed = grantConsentsSchema.safeParse({ kinds })
  if (!parsed.success) {
    return invalid
  }
  return attempt(async () => {
    await grantConsents(parsed.data)
    return null
  }, saveError)
}

export async function saveName(input: NameInput): Promise<ActionResult<null>> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return invalid
  }
  return attempt(async () => {
    await updateProfile(parsed.data)
    return null
  }, saveError)
}

export async function submitScreening(input: ScreeningInput): Promise<ActionResult<Assessment>> {
  const parsed = submitAssessmentSchema.safeParse(input)
  if (!parsed.success) {
    return invalid
  }
  return attempt(() => submitAssessment(parsed.data), saveError)
}

export async function finishOnboarding(): Promise<ActionResult<null>> {
  const result = await attempt(completeOnboarding, saveError)
  if (result.ok) {
    redirect('/today')
  }
  return invalid
}
