'use server'

import { grantConsentsSchema, updateProfileSchema } from '@mycogni/contracts'
import type { ConsentKind } from '@mycogni/domain'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { takeContinuePath } from '@/shared/lib/auth/continue-path'
import { destinationOf } from '@/shared/lib/auth/destination'
import { completeOnboarding, grantConsents, updateProfile } from '@/shared/lib/api/resources'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import type { NameInput } from './model'

async function saveError(): Promise<string> {
  const t = await getTranslations('onboarding')
  return t('saveError')
}

export async function acceptConsents(kinds: ConsentKind[]): Promise<ActionResult<null>> {
  const parsed = grantConsentsSchema.safeParse({ kinds })
  if (!parsed.success) {
    return failure(await saveError())
  }
  return attempt(
    async () => {
      await grantConsents(parsed.data)
      return null
    },
    await saveError(),
  )
}

export async function saveName(input: NameInput): Promise<ActionResult<null>> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return failure(await saveError())
  }
  return attempt(
    async () => {
      await updateProfile(parsed.data)
      return null
    },
    await saveError(),
  )
}

export async function finishOnboarding(): Promise<ActionResult<null>> {
  const result = await attempt(completeOnboarding, await saveError())
  if (result.ok) {
    revalidatePath('/', 'layout')
    redirect(destinationOf('patient', await takeContinuePath()))
  }
  return result
}
