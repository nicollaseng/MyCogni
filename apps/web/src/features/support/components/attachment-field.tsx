'use client'

import { supportAttachmentTypes, supportConvertibleImageTypes } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useState, type ChangeEvent } from 'react'
import { formatFileSize } from '@/features/professional/documents'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import type { AttachmentIssue } from '../form'
import type { PrepareAttachment } from '../send'

export interface AttachmentState {
  file: File | null
  issue: AttachmentIssue | null
}

interface AttachmentFieldProps {
  inputId: string
  state: AttachmentState
  disabled: boolean
  prepare: PrepareAttachment
  onChange: (state: AttachmentState) => void
}

const accepted = [...supportAttachmentTypes, ...supportConvertibleImageTypes].join(',')

export function AttachmentField({
  inputId,
  state,
  disabled,
  prepare,
  onChange,
}: AttachmentFieldProps) {
  const t = useTranslations('support.form')
  const locale = useLocale()
  const [preparing, setPreparing] = useState(false)
  const { file, issue } = state
  const busy = disabled || preparing

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (chosen === undefined) {
      return
    }
    setPreparing(true)
    const prepared = await prepare(chosen)
    setPreparing(false)
    onChange(
      prepared.ok ? { file: prepared.file, issue: null } : { file: null, issue: prepared.issue },
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t('attachment')}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'h-10 cursor-pointer px-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground',
            busy && 'pointer-events-none opacity-50',
          )}
        >
          <input
            id={inputId}
            type="file"
            accept={accepted}
            aria-describedby={`${inputId}-hint`}
            aria-invalid={issue === null ? undefined : true}
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              void choose(event)
            }}
          />
          {file === null ? t('choose') : t('another')}
        </label>
        {file !== null && (
          <p className="flex min-w-0 items-baseline gap-3 text-sm">
            <span className="min-w-0 break-all">
              {file.name}
              <span className="text-muted-foreground"> · {formatFileSize(file.size, locale)}</span>
            </span>
            <button
              type="button"
              aria-label={t('removeLabel', { name: file.name })}
              onClick={() => {
                onChange({ file: null, issue: null })
              }}
              className="shrink-0 underline decoration-1 underline-offset-4"
            >
              {t('remove')}
            </button>
          </p>
        )}
      </div>
      <p id={`${inputId}-hint`} className="text-sm text-pretty text-muted-foreground">
        {t('attachmentHint')}
      </p>
      {issue !== null && (
        <p role="alert" className="text-sm text-danger">
          {t(`errors.${issue}`)}
        </p>
      )}
    </div>
  )
}
