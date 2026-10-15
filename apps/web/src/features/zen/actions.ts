'use server'

import { zenStepParamsSchema, type JournalNode, type ZenStepParams } from '@mycogni/contracts'
import { stepOf, type TrackId } from '@mycogni/domain'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import { createJournalEntry, updateJournalEntry } from '@/shared/lib/api/journal'
import { completeStep, undoStep } from '@/shared/lib/api/zen'
import { contentLanguageOf } from './content/language'
import { trackText } from './content/tracks'

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

function promptDocument(prompt: string): JournalNode {
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: prompt, marks: [{ type: 'italic' }] }] },
      { type: 'paragraph' },
    ],
  }
}

async function pageWithPrompt(prompt: string): Promise<string> {
  const { id } = await createJournalEntry()
  await updateJournalEntry(id, {
    title: null,
    body: promptDocument(prompt),
    plainText: prompt,
    imagePaths: [],
  })
  return id
}

export async function writeFromPrompt(step: ZenStepParams): Promise<ActionResult<null>> {
  const [t, locale] = await Promise.all([getTranslations('zen.track'), getLocale()])
  const parsed = zenStepParamsSchema.safeParse(step)
  const prompt =
    parsed.success && stepOf(parsed.data.trackId, parsed.data.stepId)?.kind === 'write'
      ? trackText(contentLanguageOf(locale), parsed.data.trackId).steps[parsed.data.stepId]?.body
      : undefined
  if (prompt === undefined) {
    return failure(t('writeError'))
  }
  const page = await attempt(() => pageWithPrompt(prompt), t('writeError'))
  if (!page.ok) {
    return page
  }
  revalidatePath('/mybook', 'layout')
  redirect(`/mybook/${page.value}`)
}
