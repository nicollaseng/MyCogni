'use server'

import { zenStepParamsSchema, type ZenStepParams } from '@mycogni/contracts'
import type { TrackId } from '@mycogni/domain'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { completeStep, undoStep } from '@/shared/lib/api/zen'

function refreshZen(trackId: TrackId): void {
  revalidatePath('/zen')
  revalidatePath(`/zen/tracks/${trackId}`)
}

export async function setStepDone(step: ZenStepParams, done: boolean): Promise<ActionResult<null>> {
  const t = await getTranslations('zen.track')
  const parsed = zenStepParamsSchema.safeParse(step)
  if (!parsed.success) {
    return failure(t('saveError'))
  }
  const result = await attempt(async () => {
    if (done) {
      await completeStep(parsed.data)
    } else {
      await undoStep(parsed.data)
    }
  }, t('saveError'))
  if (!result.ok) {
    return result
  }
  refreshZen(parsed.data.trackId)
  return { ok: true, value: null }
}
