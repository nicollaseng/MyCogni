'use server'

import { reviewProfessionalSchema } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { reviewProfessional } from '@/shared/lib/api/care'

const professionalId = z.uuid()

export async function reviewAs(userId: string, input: unknown): Promise<ActionResult<null>> {
  const t = await getTranslations('admin.professionals')
  const id = professionalId.safeParse(userId)
  const review = reviewProfessionalSchema.safeParse(input)
  if (!id.success || !review.success) {
    return failure(t(review.success ? 'error' : 'rejectForm.required'))
  }
  return attempt(async () => {
    await reviewProfessional(id.data, review.data)
    revalidatePath('/admin/professionals')
    return null
  }, t('error'))
}
