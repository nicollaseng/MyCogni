'use client'

import type { JournalEntry, UpdateJournalEntryInput } from '@mycogni/contracts'
import type { Node as DocumentNode } from '@tiptap/pm/model'
import { EditorContent, useEditor } from '@tiptap/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Icon } from '../components/icon'
import { formatWritten } from '../dates'
import {
  draftOf,
  imageNodeName,
  isBlankDraft,
  journalDocumentOf,
  withImageSources,
} from '../document'
import { EditorToolbar } from './editor-toolbar'
import { editorContentOf, journalExtensions } from './extensions'
import { PageMenu } from './page-menu'
import { PhotoNotice } from './photo-notice'
import { fitsInPage, photoProblem, uploadPhoto, type PhotoProblem } from './photos'
import { SaveIndicator } from './save-indicator'
import { useAutosave } from './use-autosave'
import './journal.css'

interface JournalEditorProps {
  entry: JournalEntry
  timeZone: string
  save: (id: string, input: UpdateJournalEntryInput) => Promise<ActionResult<null>>
  remove: (id: string) => Promise<ActionResult<null>>
}

function imagesIn(doc: DocumentNode): number {
  let count = 0
  doc.descendants((node) => {
    if (node.type.name === imageNodeName) {
      count += 1
    }
  })
  return count
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'))
}

export function JournalEditor({ entry, timeZone, save, remove }: JournalEditorProps) {
  const t = useTranslations('mybook.editor')
  const locale = useLocale()
  const router = useRouter()
  const [title, setTitle] = useState(entry.title ?? '')
  const [uploads, setUploads] = useState(0)
  const [photoNotice, setPhotoNotice] = useState<PhotoProblem | null>(null)
  const [leaving, startLeaving] = useTransition()
  const titleRef = useRef(title)
  const titleField = useRef<HTMLTextAreaElement>(null)
  const docRef = useRef<DocumentNode | null>(null)
  const addPhotosRef = useRef<(files: File[]) => void>(() => undefined)

  const currentDraft = useCallback((): UpdateJournalEntryInput | null => {
    const doc = docRef.current === null ? entry.body : journalDocumentOf(docRef.current.toJSON())
    return doc === null ? null : draftOf(titleRef.current, doc)
  }, [entry.body])

  const autosave = useAutosave(async () => {
    const draft = currentDraft()
    return draft !== null && (await save(entry.id, draft)).ok
  })
  const deletion = useSubmit(remove, () => undefined)

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
    onUpdate: ({ editor: current }) => {
      docRef.current = current.state.doc
      autosave.touch()
    },
  })

  const addPhotos = useCallback(
    async (files: File[]) => {
      if (editor === null) {
        return
      }
      setPhotoNotice(null)
      if (!fitsInPage(imagesIn(editor.state.doc), files.length)) {
        setPhotoNotice('tooMany')
        return
      }
      for (const file of files) {
        const problem = photoProblem(file)
        if (problem !== null) {
          setPhotoNotice(problem)
          continue
        }
        setUploads((count) => count + 1)
        const uploaded = await uploadPhoto(entry.id, file)
        setUploads((count) => count - 1)
        if (uploaded === null) {
          setPhotoNotice('failed')
          continue
        }
        editor
          .chain()
          .focus()
          .insertContent({ type: imageNodeName, attrs: { path: uploaded.path, src: uploaded.url } })
          .run()
      }
    },
    [editor, entry.id],
  )

  useEffect(() => {
    addPhotosRef.current = (files) => {
      void addPhotos(files)
    }
  }, [addPhotos])

  useLayoutEffect(() => {
    const field = titleField.current
    if (field !== null) {
      field.style.height = 'auto'
      field.style.height = `${String(field.scrollHeight)}px`
    }
  }, [title])

  function leave() {
    startLeaving(async () => {
      const draft = currentDraft()
      if (draft !== null && isBlankDraft(draft)) {
        autosave.cancel()
        const removed = await remove(entry.id)
        if (removed.ok) {
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
            uploading={uploads > 0}
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
              deletion.submit(entry.id)
            }}
          />
        </div>
      </div>

      {photoNotice !== null && (
        <PhotoNotice
          problem={photoNotice}
          onDismiss={() => {
            setPhotoNotice(null)
          }}
        />
      )}

      {editor !== null && (
        <EditorToolbar
          editor={editor}
          onPhotos={(files) => {
            void addPhotos(files)
          }}
          photosDisabled={uploads > 0}
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
            autosave.touch()
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
    </div>
  )
}
