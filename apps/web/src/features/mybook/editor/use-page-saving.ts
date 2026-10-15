import type { JournalEntry, JournalNode } from '@mycogni/contracts'
import { useCallback, useRef, useState } from 'react'
import type { SafetyPrompt } from '@/features/safety/model'
import { draftOf, journalDocumentOf, withImageSources } from '../document'
import { forgetDraft, isNewerDraft, readDraft, writeDraft } from '../drafts'
import type { PageClient, RemoveOutcome } from '../page-client'
import { useAutosave, type Autosave } from './use-autosave'

export interface PageContent {
  title: string
  body: unknown
}

export interface RestoredPage {
  title: string
  body: JournalNode
}

export interface PageSaving {
  autosave: Autosave
  safety: SafetyPrompt | null
  changed: () => void
  addImage: (path: string, url: string) => void
  takeDraft: () => RestoredPage | null
  remove: () => Promise<RemoveOutcome>
}

export function usePageSaving(
  entry: JournalEntry,
  client: PageClient,
  read: () => PageContent,
): PageSaving {
  const base = useRef(entry.updatedAt)
  const revision = useRef(0)
  const sources = useRef<Readonly<Record<string, string>>>(entry.imageUrls)
  const [safety, setSafety] = useState<SafetyPrompt | null>(null)

  const autosave = useAutosave(async () => {
    const { title, body } = read()
    const doc = journalDocumentOf(body)
    if (doc === null) {
      return 'failed'
    }
    const started = revision.current
    const outcome = await client.save(entry.id, draftOf(title, doc))
    if (outcome.kind !== 'saved') {
      return outcome.kind
    }
    base.current = outcome.updatedAt
    if (outcome.safety !== null) {
      setSafety(outcome.safety)
    }
    if (revision.current === started) {
      forgetDraft(entry.id)
    }
    return 'saved'
  })
  const { touch } = autosave

  const changed = useCallback(() => {
    revision.current += 1
    const { title, body } = read()
    writeDraft(entry.id, {
      base: base.current,
      writtenAt: Date.now(),
      title,
      body,
      imageUrls: sources.current,
    })
    touch()
  }, [entry.id, read, touch])

  const addImage = useCallback((path: string, url: string) => {
    sources.current = { ...sources.current, [path]: url }
  }, [])

  const takeDraft = useCallback((): RestoredPage | null => {
    const draft = readDraft(entry.id)
    if (draft === null) {
      return null
    }
    if (!isNewerDraft(entry, draft)) {
      forgetDraft(entry.id)
      return null
    }
    sources.current = { ...draft.imageUrls, ...entry.imageUrls }
    return { title: draft.title, body: withImageSources(draft.body, sources.current) }
  }, [entry])

  const remove = useCallback(async () => {
    const outcome = await client.remove(entry.id)
    if (outcome === 'removed') {
      forgetDraft(entry.id)
    }
    return outcome
  }, [client, entry.id])

  return { autosave, safety, changed, addImage, takeDraft, remove }
}
