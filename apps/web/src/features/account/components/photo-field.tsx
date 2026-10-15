'use client'

import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Avatar, type AvatarSize } from '@/shared/components/avatar'
import { usePhotoEditing, type PhotoEditingOptions } from '../use-photo-editing'
import { FormMessage } from './form-message'

export type { PhotoTransport } from '../use-photo-editing'

interface PhotoFieldProps extends PhotoEditingOptions {
  initials: string
  alt: string
  size?: AvatarSize
  children?: ReactNode
}

const linkButton = 'text-sm underline decoration-1 underline-offset-4 disabled:opacity-50'

export function PhotoField({ initials, alt, size = 'xl', children, ...options }: PhotoFieldProps) {
  const t = useTranslations('account')
  const { url, busy, feedback, editor, choose, remove } = usePhotoEditing(options)

  return (
    <div className="flex items-center gap-5">
      <Avatar src={url} initials={initials} size={size} alt={alt} eager />
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
            <button type="button" className={linkButton} disabled={busy !== null} onClick={remove}>
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
      {editor}
    </div>
  )
}
