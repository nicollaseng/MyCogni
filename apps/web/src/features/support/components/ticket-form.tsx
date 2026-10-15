'use client'

import {
  needsCustomSubject,
  supportLimits,
  supportSubjects,
  type SupportRequesterRole,
} from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useId, useState, type SubmitEvent } from 'react'
import { Chevron } from '@/shared/components/disclosure'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import {
  emptyTicket,
  subjectOf,
  ticketIssues,
  type SendFailure,
  type SentTicket,
  type TicketField,
  type TicketValues,
} from '../form'
import { supportHomeOf } from '../routes'
import { prepareAttachment, sendTicket, type PrepareAttachment, type SendTicket } from '../send'
import { AttachmentField, type AttachmentState } from './attachment-field'
import { TicketSent } from './ticket-sent'

interface TicketFormProps {
  role: SupportRequesterRole
  email: string | null
  send?: SendTicket
  prepare?: PrepareAttachment
  onSent?: () => Promise<void>
}

const fieldStyle =
  'w-full rounded-md border border-rule bg-background text-base transition-colors outline-none focus:border-foreground aria-invalid:border-danger'

export function TicketForm({
  role,
  email,
  send = sendTicket,
  prepare = prepareAttachment,
  onSent,
}: TicketFormProps) {
  const t = useTranslations('support')
  const ids = useId()
  const [values, setValues] = useState<TicketValues>(emptyTicket)
  const [attachment, setAttachment] = useState<AttachmentState>({ file: null, issue: null })
  const [attempted, setAttempted] = useState(false)
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<SendFailure | null>(null)
  const [sent, setSent] = useState<SentTicket | null>(null)
  const issues = attempted ? ticketIssues(values) : []
  const fieldId = (field: TicketField) => `${ids}-${field}`
  const errorOf = (field: TicketField) =>
    issues.includes(field) ? t(`form.errors.${field}`) : undefined

  if (sent !== null) {
    return <TicketSent ticket={sent} email={email} role={role} />
  }

  function update(patch: Partial<TicketValues>) {
    setValues((current) => ({ ...current, ...patch }))
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    setFailure(null)
    const [first] = ticketIssues(values)
    if (first !== undefined || attachment.issue !== null) {
      document.getElementById(first === undefined ? `${ids}-file` : fieldId(first))?.focus()
      return
    }
    setSending(true)
    const result = await send(values, role, attachment.file)
    setSending(false)
    if (result.ok) {
      setSent(result.ticket)
      await onSent?.().catch(() => undefined)
    } else {
      setFailure(result.problem)
    }
  }

  const subjectError = errorOf('subject')
  const messageError = errorOf('message')

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submit(event)
      }}
      className="max-w-xl space-y-6"
    >
      <div className="space-y-2">
        <label htmlFor={fieldId('subject')} className="block text-sm font-medium">
          {t('form.subject')}
        </label>
        <div className="relative">
          <select
            id={fieldId('subject')}
            value={values.subject ?? ''}
            aria-invalid={subjectError === undefined ? undefined : true}
            aria-describedby={subjectError === undefined ? undefined : `${ids}-subject-error`}
            onChange={(event) => {
              update({ subject: subjectOf(event.currentTarget.value) })
            }}
            className={cn(fieldStyle, 'h-12 appearance-none pr-10 pl-4')}
          >
            <option value="" disabled>
              {t('form.subjectPlaceholder')}
            </option>
            {supportSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {t(`subjects.${subject}`)}
              </option>
            ))}
          </select>
          <Chevron
            open={false}
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        {subjectError !== undefined && (
          <p id={`${ids}-subject-error`} className="text-sm text-danger">
            {subjectError}
          </p>
        )}
      </div>

      {values.subject !== null && needsCustomSubject(values.subject) && (
        <TextField
          id={fieldId('customSubject')}
          label={t('form.customSubject')}
          value={values.customSubject}
          maxLength={supportLimits.customSubjectMax}
          error={errorOf('customSubject')}
          onChange={(event) => {
            update({ customSubject: event.currentTarget.value })
          }}
        />
      )}

      <div className="space-y-2">
        <label htmlFor={fieldId('message')} className="block text-sm font-medium">
          {t('form.message')}
        </label>
        <textarea
          id={fieldId('message')}
          rows={7}
          value={values.message}
          maxLength={supportLimits.messageMax}
          aria-invalid={messageError === undefined ? undefined : true}
          aria-describedby={`${ids}-message-hint ${ids}-message-count`}
          onChange={(event) => {
            update({ message: event.currentTarget.value })
          }}
          className={cn(fieldStyle, 'min-h-40 resize-y px-4 py-3 leading-relaxed')}
        />
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <p
            id={`${ids}-message-hint`}
            className={messageError === undefined ? 'text-muted-foreground' : 'text-danger'}
          >
            {messageError ?? t('form.messageHint')}
          </p>
          <p id={`${ids}-message-count`} className="shrink-0 text-muted-foreground tabular-nums">
            {t('form.count', { count: values.message.length, max: supportLimits.messageMax })}
          </p>
        </div>
      </div>

      <AttachmentField
        inputId={`${ids}-file`}
        state={attachment}
        disabled={sending}
        prepare={prepare}
        onChange={setAttachment}
      />

      <p className="text-sm text-pretty text-muted-foreground">{t('form.privacy')}</p>

      {failure !== null && (
        <p role="alert" className="text-sm text-danger">
          {t(`form.errors.${failure}`)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={sending}>
          {sending ? t('form.sending') : t('form.send')}
        </Button>
        <Link href={supportHomeOf(role)} className={buttonVariants({ variant: 'ghost' })}>
          {t('form.cancel')}
        </Link>
      </div>
    </form>
  )
}
