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
import { saveError } from './copy'
import type { ActionResult, NameInput, ScreeningInput } from './model'

async function attempt<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await work() }
  } catch (error) {
    console.error(error)
    return { ok: false, error: saveError }
  }
}

const invalid: ActionResult<never> = { ok: false, error: saveError }

export async function acceptConsents(kinds: ConsentKind[]): Promise<ActionResult<null>> {
  const parsed = grantConsentsSchema.safeParse({ kinds })
  if (!parsed.success) {
    return invalid
  }
  return attempt(async () => {
    await grantConsents(parsed.data)
    return null
  })
}

export async function saveName(input: NameInput): Promise<ActionResult<null>> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return invalid
  }
  return attempt(async () => {
    await updateProfile(parsed.data)
    return null
  })
}

export async function submitScreening(input: ScreeningInput): Promise<ActionResult<Assessment>> {
  const parsed = submitAssessmentSchema.safeParse(input)
  if (!parsed.success) {
    return invalid
  }
  return attempt(() => submitAssessment(parsed.data))
}

export async function finishOnboarding(): Promise<ActionResult<null>> {
  const result = await attempt(completeOnboarding)
  if (result.ok) {
    redirect('/today')
  }
  return invalid
}
