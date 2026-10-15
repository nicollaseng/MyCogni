'use server'

import {
  createJournalShareSchema,
  updateJournalEntrySchema,
  type CreateJournalShareInput,
  type UpdateJournalEntryInput,
} from '@mycogni/contracts'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { ApiError } from '@/shared/lib/api/client'
import {
  createJournalEntry,
  createJournalShare,
  deleteJournalEntry,
  revokeJournalShare,
  updateJournalEntry,
} from '@/shared/lib/api/journal'

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

async function newPageId(): Promise<string | null> {
  try {
    return (await createJournalEntry()).id
  } catch (cause) {
    console.error(cause)
    return null
  }
}

export async function createPage(): Promise<ActionResult<null>> {
  const t = await getTranslations('mybook.list')
  const id = await newPageId()
  if (id === null) {
    return failure(t('createError'))
  }
  redirect(`/mybook/${id}`)
}

export async function savePage(
  id: string,
  input: UpdateJournalEntryInput,
): Promise<ActionResult<null>> {
  const t = await getTranslations('mybook.feedback')
  const parsed = updateJournalEntrySchema.safeParse(input)
  if (!idSchema.safeParse(id).success || !parsed.success) {
    return failure(t('saveError'))
  }
  const saved = await succeeded(() => updateJournalEntry(id, parsed.data))
  return saved ? { ok: true, value: null } : failure(t('saveError'))
}

export async function deletePage(id: string): Promise<ActionResult<null>> {
  const t = await getTranslations('mybook.feedback')
  if (!idSchema.safeParse(id).success) {
    return failure(t('deleteError'))
  }
  if (!(await succeeded(() => deleteJournalEntry(id), true))) {
    return failure(t('deleteError'))
  }
  refreshMybook()
  redirect('/mybook')
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
