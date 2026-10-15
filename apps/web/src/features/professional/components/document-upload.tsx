'use client'

import { professionalDocumentProblem, type RegistrationProof } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState, type ChangeEvent } from 'react'
import type { UploadFailure, UploadResult } from '@/shared/lib/uploads'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'
import { formatFileSize, sendDocument } from '../documents'

interface DocumentUploadProps {
  proof: RegistrationProof
  onSent: () => Promise<void>
  send?: (file: File) => Promise<UploadResult<null>>
}

type Feedback = { kind: 'error'; problem: UploadFailure } | { kind: 'sent' } | null

export function DocumentUpload({ proof, onSent, send = sendDocument }: DocumentUploadProps) {
  const t = useTranslations('verification')
  const locale = useLocale()
  const ids = useId()
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (chosen === undefined) {
      return
    }
    const problem = professionalDocumentProblem(chosen)
    setFile(problem === null ? chosen : null)
    setFeedback(problem === null ? null : { kind: 'error', problem })
  }

  async function submit() {
    if (file === null) {
      return
    }
    setSending(true)
    setFeedback(null)
    const result = await send(file)
    if (result.ok) {
      setFile(null)
      setFeedback({ kind: 'sent' })
      await onSent()
    } else {
      setFeedback({ kind: 'error', problem: result.problem })
    }
    setSending(false)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="font-medium">{t(`proofs.${proof}.title`)}</p>
        <p id={`${ids}-hint`} className="text-sm leading-relaxed text-pretty text-muted-foreground">
          {t(`proofs.${proof}.hint`)} {t('upload.formats')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'h-9 cursor-pointer px-3.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground',
            sending && 'pointer-events-none opacity-50',
          )}
        >
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            aria-describedby={`${ids}-hint ${ids}-consent`}
            className="sr-only"
            disabled={sending}
            onChange={choose}
          />
          {file === null ? t('upload.choose') : t('upload.another')}
        </label>
        {file !== null && (
          <p className="min-w-0 text-sm break-all">
            {file.name}
            <span className="text-muted-foreground"> · {formatFileSize(file.size, locale)}</span>
          </p>
        )}
      </div>
      <p
        id={`${ids}-consent`}
        className="text-sm leading-relaxed text-pretty text-muted-foreground"
      >
        {t('upload.consent')}
      </p>
      <div className="min-h-5 text-sm" aria-live="polite">
        {feedback?.kind === 'error' && (
          <p role="alert" className="text-danger">
            {t(`upload.errors.${feedback.problem}`)}
          </p>
        )}
        {feedback?.kind === 'sent' && <p role="status">{t('upload.sent')}</p>}
      </div>
      <Button
        size="sm"
        className="h-10 px-4 text-[15px]"
        disabled={file === null || sending}
        onClick={() => {
          void submit()
        }}
      >
        {sending ? t('upload.sending') : t('upload.send')}
      </Button>
    </div>
  )
}
