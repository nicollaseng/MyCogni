'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { changeAlert } from '@/shared/lib/api/alerts'

const alertId = z.uuid()

async function change(id: string, action: 'acknowledge' | 'resolve'): Promise<ActionResult<null>> {
  const t = await getTranslations('alerts')
  if (!alertId.safeParse(id).success) {
    return failure(t('error'))
  }
  return attempt(async () => {
    await changeAlert(id, action)
    revalidatePath('/pro', 'layout')
    return null
  }, t('error'))
}

export async function acknowledgeAlert(id: string): Promise<ActionResult<null>> {
  return change(id, 'acknowledge')
}

export async function resolveAlert(id: string): Promise<ActionResult<null>> {
  return change(id, 'resolve')
}
