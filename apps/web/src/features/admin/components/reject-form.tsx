'use client'

import { professionalDocumentLimits } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId, useState, type SubmitEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { reviewNoteMinLength } from '../review'

interface RejectFormProps {
  name: string
  pending: boolean
  onReject: (note: string) => void
  onCancel: () => void
}

export function RejectForm({ name, pending, onReject, onCancel }: RejectFormProps) {
  const t = useTranslations('admin.professionals.rejectForm')
  const ids = useId()
  const [note, setNote] = useState('')
  const [attempted, setAttempted] = useState(false)
  const tooShort = note.trim().length < reviewNoteMinLength

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    if (!tooShort) {
      onReject(note.trim())
    }
  }

  return (
    <form noValidate onSubmit={submit} className="max-w-xl space-y-3 py-1">
      <div className="space-y-1.5">
        <label htmlFor={`${ids}-note`} className="block text-sm font-medium">
          {t('label', { name })}
        </label>
        <textarea
          id={`${ids}-note`}
          rows={3}
          maxLength={professionalDocumentLimits.reviewNote}
          value={note}
          autoFocus
          aria-invalid={attempted && tooShort ? true : undefined}
          aria-describedby={`${ids}-hint`}
          onChange={(event) => {
            setNote(event.currentTarget.value)
          }}
          className="w-full resize-y rounded-[6px] border border-rule bg-background px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-foreground aria-invalid:border-danger"
        />
        <p
          id={`${ids}-hint`}
          className={
            attempted && tooShort ? 'text-sm text-danger' : 'text-sm text-muted-foreground'
          }
        >
          {attempted && tooShort ? t('required') : t('hint')}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-8 px-3 text-sm" disabled={pending}>
          {t('confirm')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-sm hover:bg-background"
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
