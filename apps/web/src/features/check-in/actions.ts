'use server'

import { createCheckInSchema, type CheckIn, type CreateCheckInInput } from '@mycogni/contracts'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { createCheckIn } from '@/shared/lib/api/resources'

const saveError = 'Não conseguimos registrar agora. Tente de novo em instantes.'

export async function saveCheckIn(input: CreateCheckInInput): Promise<ActionResult<CheckIn>> {
  const parsed = createCheckInSchema.safeParse(input)
  if (!parsed.success) {
    return failure(saveError)
  }
  return attempt(() => createCheckIn(parsed.data), saveError)
}
