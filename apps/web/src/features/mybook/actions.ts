'use server'

import { createJournalShareSchema, type CreateJournalShareInput } from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { ApiError } from '@/shared/lib/api/client'
import { createJournalShare, revokeJournalShare } from '@/shared/lib/api/journal'

const idSchema = z.uuid()

async function succeeded(work: () => Promise<unknown>, acceptMissing = false): Promise<boolean> {
  try {
    await work()
    return true
  } catch (cause) {
    if (acceptMissing && cause instanceof ApiError && cause.status === 404) {
      return true
    }
    console.error(cause)
    return false
  }
}

function refreshMybook(): void {
  revalidatePath('/mybook', 'layout')
}

export async function shareJournal(input: CreateJournalShareInput): Promise<ActionResult<null>> {
  const t = await getTranslations('mybook.feedback')
  const parsed = createJournalShareSchema.safeParse(input)
  if (!parsed.success || !(await succeeded(() => createJournalShare(parsed.data)))) {
    return failure(t('shareError'))
  }
  refreshMybook()
  return { ok: true, value: null }
}

export async function revokeShare(id: string): Promise<ActionResult<null>> {
  const t = await getTranslations('mybook.feedback')
  if (!idSchema.safeParse(id).success || !(await succeeded(() => revokeJournalShare(id), true))) {
    return failure(t('revokeError'))
  }
  refreshMybook()
  return { ok: true, value: null }
}
