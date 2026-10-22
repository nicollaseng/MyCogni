'use client'

import type { JournalEntry } from '@mycogni/contracts'
import type { Node as DocumentNode } from '@tiptap/pm/model'
import { EditorContent, useEditor } from '@tiptap/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { PageAssistant } from '@/features/assistant/components/page-assistant'
import type { AssistantActions } from '@/features/assistant/model'
import { SafetyNotice } from '@/features/safety/components/safety-notice'
import { ReloadNotice } from '@/shared/components/reload-notice'
import { useSubmit } from '@/shared/hooks/use-submit'
import { reportOutdatedApp } from '@/shared/lib/actions/outdated'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { Icon } from '../components/icon'
import { formatWritten } from '../dates'
import {
  draftOf,
  isBlankDraft,
  journalDocumentOf,
  storedBodyOf,
  withImageSources,
} from '../document'
import { GalleryContext } from '../gallery/gallery-context'
import { PagePhotoViewer } from '../gallery/page-photo-viewer'
import { PhotoCompose } from '../gallery/photo-compose'
import { useRevealPhotoFromHash } from '../gallery/use-photo-hash'
import { usePhotoViewing } from '../gallery/use-photo-viewing'
import { browserPageClient, type PageClient } from '../page-client'
import { EditorToolbar } from './editor-toolbar'
import { editorContentOf, journalExtensions } from './extensions'
import { PageMenu } from './page-menu'
import { browserPhotoTools, type PhotoTools } from './photo-canvas'
import { PhotoNotice } from './photo-notice'
import { SaveIndicator } from './save-indicator'
import { usePagePhotos } from './use-page-photos'
import { usePageSaving, type PageContent } from './use-page-saving'
import { bottomSpace, useWritingChrome } from './use-writing-chrome'
import { useWideScreen } from './viewport'
import './journal.css'

interface JournalEditorProps {
  entry: JournalEntry
  timeZone: string
  client?: PageClient
  photoTools?: PhotoTools
  assistantActions?: AssistantActions
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'))
}

export function JournalEditor({
  entry,
  timeZone,
  client = browserPageClient,
  photoTools = browserPhotoTools,
  assistantActions,
}: JournalEditorProps) {
  const t = useTranslations('mybook.editor')
  const feedback = useTranslations('mybook.feedback')
  const locale = useLocale()
  const router = useRouter()
  const [title, setTitle] = useState(entry.title ?? '')
  const [leaving, startLeaving] = useTransition()
  const titleRef = useRef(title)
  const titleField = useRef<HTMLTextAreaElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<DocumentNode | null>(null)
  const addPhotosRef = useRef<(files: File[]) => void>(() => undefined)
  const photoViewing = usePhotoViewing()

  const read = useCallback((): PageContent => {
    const body: unknown = docRef.current?.toJSON()
    return { title: titleRef.current, body: body === undefined ? entry.body : storedBodyOf(body) }
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
  useRevealPhotoFromHash(editor)
  const wide = useWideScreen()
  const chrome = useWritingChrome(editor, pageRef, chromeRef, !wide)

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
    <div
      ref={pageRef}
      className="space-y-6"
      style={wide ? undefined : { paddingBottom: bottomSpace(chrome) }}
    >
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
          {assistantActions !== undefined && (
            <PageAssistant
              entryId={entry.id}
              actions={assistantActions}
              timeZone={timeZone}
              prepare={autosave.flush}
            />
          )}
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
        {saving.safety !== null && <SafetyNotice prompt={saving.safety} />}
      </div>

      {autosave.status === 'outdated' && <ReloadNotice message={t('status.outdated')} />}

      {photos.notice !== null && (
        <PhotoNotice problem={photos.notice} onDismiss={photos.dismissNotice} />
      )}

      {editor !== null && (
        <EditorToolbar
          editor={editor}
          chrome={chrome}
          surface={chromeRef}
          wide={wide}
          onPhotos={choose}
          photosDisabled={photos.uploading}
        />
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

      <GalleryContext value={photoViewing.actions}>
        <EditorContent editor={editor} />
      </GalleryContext>

      {photoViewing.viewing !== null && editor !== null && (
        <PagePhotoViewer
          editor={editor}
          start={photoViewing.viewing}
          owner={{ writtenAt: new Date(entry.createdAt), timeZone }}
          onClose={photoViewing.close}
        />
      )}

      {photos.choosing !== null && (
        <PhotoCompose
          photos={photos.choosing}
          tools={photoTools}
          onAdd={photos.add}
          onClose={photos.closeChooser}
        />
      )}
    </div>
  )
}
