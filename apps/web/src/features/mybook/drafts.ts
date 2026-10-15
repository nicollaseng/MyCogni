import { journalDocumentSchema, type JournalEntry, type JournalNode } from '@mycogni/contracts'
import { z } from 'zod'

export interface PageDraft {
  base: string
  writtenAt: number
  title: string
  body: JournalNode
  imageUrls: Readonly<Record<string, string>>
}

export type DraftToWrite = Omit<PageDraft, 'body'> & { body: unknown }

const draftSchema = z.object({
  base: z.iso.datetime({ offset: true }),
  writtenAt: z.number().int().nonnegative(),
  title: z.string(),
  body: journalDocumentSchema,
  imageUrls: z.record(z.string(), z.string()),
})

const keyPrefix = 'mycogni.mybook.draft.'

function keyOf(entryId: string): string {
  return `${keyPrefix}${entryId}`
}

export function readDraft(entryId: string): PageDraft | null {
  try {
    const stored = window.localStorage.getItem(keyOf(entryId))
    if (stored === null) {
      return null
    }
    const parsed = draftSchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function writeDraft(entryId: string, draft: DraftToWrite): boolean {
  try {
    window.localStorage.setItem(keyOf(entryId), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function forgetDraft(entryId: string): boolean {
  try {
    window.localStorage.removeItem(keyOf(entryId))
    return true
  } catch {
    return false
  }
}

export function isNewerDraft(entry: Pick<JournalEntry, 'updatedAt'>, draft: PageDraft): boolean {
  const saved = Date.parse(entry.updatedAt)
  return saved <= Date.parse(draft.base) || draft.writtenAt > saved
}
