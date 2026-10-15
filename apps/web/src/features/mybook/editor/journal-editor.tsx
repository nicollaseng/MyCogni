'use client'

import type { JournalEntry } from '@mycogni/contracts'
import type { Node as DocumentNode } from '@tiptap/pm/model'
import { EditorContent, useEditor } from '@tiptap/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { SafetyNotice } from '@/features/safety/components/safety-notice'
import { ReloadNotice } from '@/shared/components/reload-notice'
import { useSubmit } from '@/shared/hooks/use-submit'
import { reportOutdatedApp } from '@/shared/lib/actions/outdated'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { Icon } from '../components/icon'
import { formatWritten } from '../dates'
import { draftOf, isBlankDraft, journalDocumentOf, withImageSources } from '../document'
import { browserPageClient, type PageClient } from '../page-client'
import { EditorToolbar } from './editor-toolbar'
import { editorContentOf, journalExtensions } from './extensions'
import { PageMenu } from './page-menu'
import { browserPhotoTools, type PhotoTools } from './photo-canvas'
import { PhotoNotice } from './photo-notice'
import { PhotoSizeSheet } from './photo-size-sheet'
import { SaveIndicator } from './save-indicator'
import { usePagePhotos } from './use-page-photos'
import { usePageSaving, type PageContent } from './use-page-saving'
import './journal.css'

interface JournalEditorProps {
  entry: JournalEntry
  timeZone: string
  client?: PageClient
  photoTools?: PhotoTools
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'))
}

export function JournalEditor({
  entry,
  timeZone,
  client = browserPageClient,
  photoTools = browserPhotoTools,
}: JournalEditorProps) {
  const t = useTranslations('mybook.editor')
  const feedback = useTranslations('mybook.feedback')
  const locale = useLocale()
  const router = useRouter()
  const [title, setTitle] = useState(entry.title ?? '')
  const [leaving, startLeaving] = useTransition()
  const titleRef = useRef(title)
  const titleField = useRef<HTMLTextAreaElement>(null)
  const docRef = useRef<DocumentNode | null>(null)
  const addPhotosRef = useRef<(files: File[]) => void>(() => undefined)

  const read = useCallback((): PageContent => {
    const body: unknown = docRef.current?.toJSON()
    return { title: titleRef.current, body: body ?? entry.body }
  }, [entry.body])
  const saving = usePageSaving(entry, client, read)
  const { autosave } = saving

  async function removePage(): Promise<ActionResult<null> | null> {
    const outcome = await saving.remove()
    if (outcome === 'outdated') {
      reportOutdatedApp()
      return null
    }
    return outcome === 'removed' ? { ok: true, value: null } : failure(feedback('deleteError'))
  }
  const deletion = useSubmit(removePage, () => {
    router.push('/mybook')
  })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: journalExtensions({
      placeholder: t('placeholder'),
      photo: t('photo.alt'),
      task: (text) => (text === '' ? t('emptyTask') : t('task', { text })),
    }),
    content: editorContentOf(withImageSources(entry.body, entry.imageUrls)),
    editorProps: {
      attributes: {
        class: 'journal',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': t('bodyLabel'),
      },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files)
        if (files.length > 0) {
          addPhotosRef.current(files)
        }
        return files.length > 0
      },
      handleDrop: (_view, event) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (files.length > 0) {
          event.preventDefault()
          addPhotosRef.current(files)
        }
        return files.length > 0
      },
    },
    onCreate: ({ editor: created }) => {
      const restored = saving.takeDraft()
      if (restored === null) {
        return
      }
      created
        .chain()
        .setMeta('addToHistory', false)
        .setContent(editorContentOf(restored.body), { emitUpdate: false })
        .run()
      docRef.current = created.state.doc
      titleRef.current = restored.title
      setTitle(restored.title)
      saving.changed()
    },
    onUpdate: ({ editor: current }) => {
      docRef.current = current.state.doc
      saving.changed()
    },
  })

  const photos = usePagePhotos({
    editor,
    entryId: entry.id,
    tools: photoTools,
    onUploaded: saving.addImage,
  })
  const { choose } = photos

  useEffect(() => {
    addPhotosRef.current = choose
  }, [choose])

  useLayoutEffect(() => {
    const field = titleField.current
    if (field !== null) {
      field.style.height = 'auto'
      field.style.height = `${String(field.scrollHeight)}px`
    }
  }, [title])

  function currentDraft() {
    const { title: currentTitle, body } = read()
    const doc = journalDocumentOf(body)
    return doc === null ? null : draftOf(currentTitle, doc)
  }

  function leave() {
    startLeaving(async () => {
      const draft = currentDraft()
      if (draft !== null && isBlankDraft(draft)) {
        autosave.cancel()
        if ((await removePage())?.ok === true) {
          router.push('/mybook')
          return
        }
      }
      if (await autosave.flush()) {
        router.push('/mybook')
      }
    })
  }

  function share() {
    startLeaving(async () => {
      if (await autosave.flush()) {
        router.push(`/mybook/sharing?page=${entry.id}`)
      }
    })
  }

  return (
    <div className="space-y-6 pb-28 sm:pb-0">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/mybook"
          aria-disabled={leaving}
          onClick={(event) => {
            event.preventDefault()
            leave()
          }}
          className="-ml-1 inline-flex h-10 shrink-0 items-center gap-1 pr-2 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="back" />
          {t('back')}
        </Link>
        <div className="flex min-w-0 items-center gap-1">
          <SaveIndicator
            status={autosave.status}
            uploading={photos.uploading}
            onRetry={() => {
              void autosave.flush()
            }}
          />
          <PageMenu
            entryId={entry.id}
            deleting={deletion.pending}
            error={deletion.error}
            onShare={share}
            onDelete={() => {
              autosave.cancel()
              deletion.submit()
            }}
          />
        </div>
      </div>

      <div aria-live="polite" className="empty:hidden">
        {saving.safety !== null && (
          <SafetyNotice key={saving.safety.level} prompt={saving.safety} />
        )}
      </div>

      {autosave.status === 'outdated' && <ReloadNotice message={t('status.outdated')} />}

      {photos.notice !== null && (
        <PhotoNotice problem={photos.notice} onDismiss={photos.dismissNotice} />
      )}

      {editor !== null && (
        <EditorToolbar editor={editor} onPhotos={choose} photosDisabled={photos.uploading} />
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {t('written', { date: formatWritten(new Date(entry.createdAt), timeZone, locale) })}
        </p>
        <textarea
          ref={titleField}
          value={title}
          autoFocus={
            entry.title === null && entry.plainText === '' && entry.imagePaths.length === 0
          }
          rows={1}
          maxLength={200}
          aria-label={t('titleLabel')}
          placeholder={t('titlePlaceholder')}
          onChange={(event) => {
            setTitle(event.target.value)
            titleRef.current = event.target.value
            saving.changed()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              editor?.commands.focus('start')
            }
          }}
          className="block w-full resize-none overflow-hidden bg-transparent font-serif text-[34px] leading-[1.1] tracking-[-0.02em] outline-none placeholder:text-muted-foreground/60 sm:text-[42px]"
        />
      </div>

      <EditorContent editor={editor} />

      {photos.choosing !== null && (
        <PhotoSizeSheet
          photos={photos.choosing}
          tools={photoTools}
          onAdd={photos.add}
          onClose={photos.closeChooser}
        />
      )}
    </div>
  )
}
