'use client'

import { avatarSourceProblem } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState, type ChangeEvent, type ReactNode } from 'react'
import { Avatar, type AvatarSize } from '@/shared/components/avatar'
import type { UploadFailure, UploadResult } from '@/shared/lib/uploads'
import { renderPhoto, type RenderPhoto } from '../photo-canvas'
import { deletePhoto, sendPhoto } from '../photo-upload'
import { FormMessage } from './form-message'
import { PhotoEditor } from './photo-editor'

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

interface PhotoFieldProps {
  photoUrl: string | null
  initials: string
  alt: string
  size?: AvatarSize
  onSaved: () => Promise<void>
  onChange?: (url: string | null) => void
  transport?: PhotoTransport
  children?: ReactNode
}

interface Draft {
  source: File
  preview: string
}

type Feedback = { kind: 'error' | 'notice'; text: string } | null

const linkButton = 'text-sm underline decoration-1 underline-offset-4 disabled:opacity-50'

const failureMessages = {
  type: 'photoType',
  size: 'photoSize',
  failed: 'photoError',
} as const satisfies Record<UploadFailure, string>

export function PhotoField({
  photoUrl,
  initials,
  alt,
  size = 'xl',
  onSaved,
  onChange,
  transport = browserTransport,
  children,
}: PhotoFieldProps) {
  const t = useTranslations('account')
  const [url, setUrl] = useState(photoUrl)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState<'uploading' | 'removing' | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)

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
    setDraft({ source, preview: URL.createObjectURL(source) })
  }

  function closeEditor() {
    if (draft !== null) {
      URL.revokeObjectURL(draft.preview)
    }
    setDraft(null)
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

  return (
    <div className="flex items-center gap-5">
      <Avatar src={url} initials={initials} size={size} alt={alt} />
      <div className="min-w-0 space-y-1.5">
        {children}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <label className={`${linkButton} cursor-pointer has-disabled:cursor-default`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy !== null}
              onChange={choose}
            />
            {busy === 'uploading'
              ? t('avatar.uploading')
              : url === null
                ? t('avatar.add')
                : t('avatar.change')}
          </label>
          {url !== null && (
            <button
              type="button"
              className={linkButton}
              disabled={busy !== null}
              onClick={() => {
                void remove()
              }}
            >
              {busy === 'removing' ? t('avatar.removing') : t('avatar.remove')}
            </button>
          )}
        </div>
        <div aria-live="polite">
          <FormMessage
            error={feedback?.kind === 'error' ? feedback.text : null}
            notice={feedback?.kind === 'notice' ? feedback.text : null}
          />
        </div>
      </div>
      {draft !== null && (
        <PhotoEditor
          source={draft.source}
          preview={draft.preview}
          render={transport.render}
          onConfirm={(photo) => {
            void upload(photo)
          }}
          onClose={closeEditor}
        />
      )}
    </div>
  )
}
