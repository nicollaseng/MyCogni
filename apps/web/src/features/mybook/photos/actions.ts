'use server'

import type { JournalPhotoPage } from '@mycogni/contracts'
import { isCaptionText } from '@mycogni/domain'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import type { SafetyPrompt } from '@/features/safety/model'
import { safetyPromptFor } from '@/features/safety/prompt'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { fetchJournalEntry, fetchJournalPhotos, updateJournalEntry } from '@/shared/lib/api/journal'
import { draftOf, withoutPhoto, withPhotoCaption } from '../document'
import { photoBatch, type PhotoChange } from './model'

const changeSchema = z.object({
  entryId: z.uuid(),
  path: z.string().min(1).max(200),
  change: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('caption'), caption: z.string().refine(isCaptionText) }),
    z.object({ kind: z.literal('remove') }),
  ]),
})

export async function loadPhotos(offset: number): Promise<ActionResult<JournalPhotoPage>> {
  const t = await getTranslations('mybook.photoGrid')
  if (!Number.isInteger(offset) || offset < 0) {
    return failure(t('loadError'))
  }
  return attempt(() => fetchJournalPhotos({ offset, limit: photoBatch }), t('loadError'))
}

export async function changePhoto(
  entryId: string,
  path: string,
  change: PhotoChange,
): Promise<ActionResult<SafetyPrompt | null>> {
  const t = await getTranslations('mybook.viewer')
  const parsed = changeSchema.safeParse({ entryId, path, change })
  if (!parsed.success) {
    return failure(t('saveError'))
  }
  const result = await attempt(async () => {
    const entry = await fetchJournalEntry(entryId)
    if (entry === null) {
      throw new Error('Page not found')
    }
    const body =
      parsed.data.change.kind === 'remove'
        ? withoutPhoto(entry.body, path)
        : withPhotoCaption(entry.body, path, parsed.data.change.caption.trim())
    const saved = await updateJournalEntry(entryId, draftOf(entry.title ?? '', body))
    return safetyPromptFor(saved.support.level)
  }, t('saveError'))
  if (result.ok) {
    revalidatePath('/mybook', 'layout')
  }
  return result
}
