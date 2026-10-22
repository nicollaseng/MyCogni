'use client'

import { useTranslations } from 'next-intl'
import { useState, type ReactNode } from 'react'
import { Avatar, type AvatarSize } from '@/shared/components/avatar'
import { PencilIcon } from '@/shared/components/icons'
import { usePhotoEditing, type PhotoEditingOptions } from '../use-photo-editing'
import { FormMessage } from './form-message'
import { PhotoViewer } from './photo-viewer'

interface ProfilePhotoProps extends PhotoEditingOptions {
  initials: string
  alt: string
  size?: AvatarSize
  children?: ReactNode
}

export function ProfilePhoto({
  initials,
  alt,
  size = 'xl',
  children,
  ...options
}: ProfilePhotoProps) {
  const t = useTranslations('account.photoViewer')
  const { url, busy, feedback, editor, choose, adjust, remove } = usePhotoEditing(options)
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        aria-label={t('open')}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
        }}
        className="group relative shrink-0 cursor-pointer rounded-full outline-offset-4"
      >
        <Avatar src={url} initials={initials} size={size} eager />
        <span
          aria-hidden
          data-overlay="hover"
          className="absolute inset-0 hidden place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none pointer-fine:grid"
        >
          <PencilIcon className="size-6" />
        </span>
        <span
          aria-hidden
          data-overlay="badge"
          className="absolute -right-0.5 -bottom-0.5 grid size-7 place-items-center rounded-full bg-foreground text-background ring-2 ring-background pointer-fine:hidden"
        >
          <PencilIcon className="size-3.5" />
        </span>
      </button>
      {children !== undefined && <div className="min-w-0 space-y-1">{children}</div>}
      {!open && feedback !== null && (
        <div aria-live="polite" className="sr-only">
          <FormMessage
            error={feedback.kind === 'error' ? feedback.text : null}
            notice={feedback.kind === 'notice' ? feedback.text : null}
          />
        </div>
      )}
      {open && (
        <PhotoViewer
          url={url}
          initials={initials}
          alt={alt}
          busy={busy}
          feedback={feedback}
          onClose={() => {
            setOpen(false)
          }}
          onChoose={choose}
          onAdjust={adjust}
          onRemove={remove}
        />
      )}
      {editor}
    </div>
  )
}
