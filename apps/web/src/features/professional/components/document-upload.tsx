'use client'

import {
  isProfessionalDocumentType,
  professionalDocumentProblem,
  type ProfessionalDocumentType,
  type RegistrationProof,
} from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import { unlessOutdated } from '@/shared/lib/actions/outdated'
import type { UploadFailure, UploadResult } from '@/shared/lib/uploads'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { documentFormat, formatFileSize, sendDocument } from '../documents'
import { DocumentIcon } from './icons'

interface DocumentUploadProps {
  proof: RegistrationProof
  onSent: () => Promise<void>
  send?: (file: File) => Promise<UploadResult<null>>
}

interface Chosen {
  file: File
  contentType: ProfessionalDocumentType
}

type Feedback = { kind: 'error'; problem: UploadFailure } | { kind: 'sent' } | null

const accepted = 'application/pdf,image/jpeg,image/png'

const linkAction =
  'cursor-pointer text-sm underline decoration-1 underline-offset-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground has-disabled:pointer-events-none has-disabled:opacity-50 disabled:pointer-events-none disabled:opacity-50'

const appear = 'transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none'

function focusOnMount(element: HTMLElement | null) {
  element?.focus()
}

export function DocumentUpload({ proof, onSent, send = sendDocument }: DocumentUploadProps) {
  const t = useTranslations('verification')
  const locale = useLocale()
  const ids = useId()
  const [chosen, setChosen] = useState<Chosen | null>(null)
  const [dragging, setDragging] = useState(false)
  const [sending, setSending] = useState(false)
  const [refocus, setRefocus] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const described = `${ids}-hint ${ids}-formats ${ids}-consent`

  function take(file: File | undefined) {
    if (file === undefined) {
      return
    }
    const problem = professionalDocumentProblem(file)
    if (problem !== null || !isProfessionalDocumentType(file.type)) {
      setFeedback({ kind: 'error', problem: problem ?? 'type' })
      return
    }
    setChosen({ file, contentType: file.type })
    setFeedback(null)
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    take(event.currentTarget.files?.[0])
    event.currentTarget.value = ''
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    take(event.dataTransfer.files[0])
  }

  function clear() {
    setChosen(null)
    setFeedback(null)
    setRefocus(true)
  }

  async function submit(file: File) {
    setSending(true)
    setFeedback(null)
    const result = await send(file)
    if (result.ok) {
      setFeedback({ kind: 'sent' })
      await unlessOutdated(onSent)
      setChosen(null)
    } else {
      setFeedback({ kind: 'error', problem: result.problem })
    }
    setSending(false)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-[17px] font-medium">{t(`proofs.${proof}.title`)}</h2>
        <p
          id={`${ids}-hint`}
          className="text-[15px] leading-relaxed text-pretty text-muted-foreground"
        >
          {t(`proofs.${proof}.hint`)}
        </p>
      </div>
      {chosen === null ? (
        <label
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => {
            setDragging(false)
          }}
          onDrop={drop}
          className={cn(
            'flex cursor-pointer items-center gap-4 rounded-[8px] border border-dashed px-5 py-5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground motion-reduce:transition-none',
            dragging
              ? 'border-foreground/50 bg-surface'
              : 'border-foreground/25 hover:border-foreground/40 hover:bg-surface',
          )}
        >
          <input
            ref={refocus ? focusOnMount : undefined}
            type="file"
            accept={accepted}
            aria-labelledby={`${ids}-choose`}
            aria-describedby={described}
            className="sr-only"
            onChange={choose}
          />
          <DocumentIcon className="size-6 text-muted-foreground" />
          <span className="min-w-0 space-y-0.5">
            <span className="block">
              <span
                id={`${ids}-choose`}
                className="font-medium underline decoration-1 underline-offset-4"
              >
                {t('upload.choose')}
              </span>
              <span className="text-muted-foreground max-sm:hidden"> {t('upload.drop')}</span>
            </span>
            <span id={`${ids}-formats`} className="block text-sm text-muted-foreground">
              {t('upload.formats')}
            </span>
          </span>
        </label>
      ) : (
        <div className={cn('flex items-start gap-4 rounded-[8px] bg-surface px-5 py-4', appear)}>
          <DocumentIcon className="mt-0.5 size-6 text-muted-foreground" />
          <div className="min-w-0 flex-1 gap-x-6 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium break-all">{chosen.file.name}</p>
              <p id={`${ids}-formats`} className="text-sm text-muted-foreground">
                {documentFormat(chosen)} · {formatFileSize(chosen.file.size, locale)}
              </p>
            </div>
            <div className="mt-2 flex shrink-0 gap-4 sm:mt-0">
              <label className={linkAction}>
                <input
                  type="file"
                  accept={accepted}
                  aria-describedby={described}
                  className="sr-only"
                  disabled={sending}
                  onChange={choose}
                />
                {t('upload.replace')}
              </label>
              <button type="button" className={linkAction} disabled={sending} onClick={clear}>
                {t('upload.remove')}
              </button>
            </div>
          </div>
        </div>
      )}
      {feedback?.kind === 'error' && (
        <p role="alert" className="text-sm text-danger">
          {t(`upload.errors.${feedback.problem}`)}
        </p>
      )}
      {feedback?.kind === 'sent' && (
        <p role="status" className="text-sm">
          {t('upload.sent')}
        </p>
      )}
      <p
        id={`${ids}-consent`}
        className="text-sm leading-relaxed text-pretty text-muted-foreground"
      >
        {t('upload.consent')}
      </p>
      {chosen !== null && (
        <Button
          ref={focusOnMount}
          size="sm"
          className={cn('h-11 px-5 text-[15px]', appear)}
          disabled={sending}
          onClick={() => {
            void submit(chosen.file)
          }}
        >
          {sending ? t('upload.sending') : t('upload.send')}
        </Button>
      )}
    </div>
  )
}
