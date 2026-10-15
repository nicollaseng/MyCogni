'use client'

import { avatarSourceProblem } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState, type ChangeEvent, type ReactNode } from 'react'
import type { UploadFailure, UploadResult } from '@/shared/lib/uploads'
import { PhotoEditor } from './components/photo-editor'
import { renderPhoto, type RenderPhoto } from './photo-canvas'
import { deletePhoto, sendPhoto } from './photo-upload'

export interface PhotoTransport {
  send: (photo: File) => Promise<UploadResult<string | null>>
  remove: () => Promise<UploadResult<null>>
  render: RenderPhoto
}

const browserTransport: PhotoTransport = {
  send: sendPhoto,
  remove: deletePhoto,
  render: renderPhoto,
}

export interface PhotoEditingOptions {
  photoUrl: string | null
  onSaved: () => Promise<void>
  onChange?: (url: string | null) => void
  transport?: PhotoTransport
}

export type PhotoFeedback = { kind: 'error' | 'notice'; text: string } | null

interface Draft {
  source: File
  preview: string
}

const failureMessages = {
  type: 'photoType',
  size: 'photoSize',
  failed: 'photoError',
} as const satisfies Record<UploadFailure, string>

export function usePhotoEditing({
  photoUrl,
  onSaved,
  onChange,
  transport = browserTransport,
}: PhotoEditingOptions) {
  const t = useTranslations('account')
  const [url, setUrl] = useState(photoUrl)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState<'uploading' | 'removing' | null>(null)
  const [feedback, setFeedback] = useState<PhotoFeedback>(null)

  function fail(problem: UploadFailure) {
    setFeedback({ kind: 'error', text: t(`feedback.${failureMessages[problem]}`) })
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const source = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (source === undefined) {
      return
    }
    const problem = avatarSourceProblem(source)
    if (problem !== null) {
      fail(problem)
      return
    }
    setFeedback(null)
    if (draft !== null) {
      URL.revokeObjectURL(draft.preview)
    }
    setDraft({ source, preview: URL.createObjectURL(source) })
  }

  function closeEditor(preview: string) {
    URL.revokeObjectURL(preview)
    setDraft((current) => (current?.preview === preview ? null : current))
  }

  async function upload(photo: File) {
    setBusy('uploading')
    const result = await transport.send(photo)
    if (result.ok) {
      setUrl(result.value)
      onChange?.(result.value)
      await onSaved()
      setFeedback({ kind: 'notice', text: t('feedback.photoSaved') })
    } else {
      fail(result.problem)
    }
    setBusy(null)
  }

  async function remove() {
    setBusy('removing')
    setFeedback(null)
    const result = await transport.remove()
    if (result.ok) {
      setUrl(null)
      onChange?.(null)
      await onSaved()
      setFeedback({ kind: 'notice', text: t('feedback.photoRemoved') })
    } else {
      fail(result.problem)
    }
    setBusy(null)
  }

  const editor: ReactNode =
    draft === null ? null : (
      <PhotoEditor
        key={draft.preview}
        source={draft.source}
        preview={draft.preview}
        render={transport.render}
        onConfirm={(photo) => {
          void upload(photo)
        }}
        onClose={() => {
          closeEditor(draft.preview)
        }}
      />
    )

  return {
    url,
    busy,
    feedback,
    editor,
    choose,
    remove: () => {
      void remove()
    },
  }
}
