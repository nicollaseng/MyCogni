'use client'

import type { AdminSupportTicket } from '@mycogni/contracts'
import { supportLimits, supportTicketLabel } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId, useState, type SubmitEvent } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { ChangeTicketStatus } from '../support'

interface SupportActionsProps {
  ticket: Pick<AdminSupportTicket, 'id' | 'number' | 'status'>
  change: ChangeTicketStatus
}

const actionButton = 'h-9 px-3.5 text-sm'

export function SupportActions({ ticket, change }: SupportActionsProps) {
  const t = useTranslations('admin.support.actions')
  const ids = useId()
  const [closing, setClosing] = useState(false)
  const [note, setNote] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const label = supportTicketLabel(ticket.number)
  const { submit, pending, error } = useSubmit(change, (updated) => {
    setClosing(false)
    setNote('')
    setDone(t(updated.status === 'closed' ? 'closed' : 'taken', { ticket: label }))
  })

  function close(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = note.trim()
    submit(ticket.id, trimmed === '' ? { status: 'closed' } : { status: 'closed', note: trimmed })
  }

  return (
    <div>
      {ticket.status === 'closed' ? (
        <p className="text-[15px] text-muted-foreground">{t('final')}</p>
      ) : closing ? (
        <form noValidate onSubmit={close} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor={`${ids}-note`} className="block text-sm font-medium">
              {t('noteLabel')}
            </label>
            <textarea
              id={`${ids}-note`}
              rows={4}
              maxLength={supportLimits.closingNote}
              value={note}
              autoFocus
              aria-describedby={`${ids}-hint`}
              onChange={(event) => {
                setNote(event.currentTarget.value)
              }}
              className="w-full resize-y rounded-[6px] border border-rule bg-background px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-foreground"
            />
            <p id={`${ids}-hint`} className="text-sm text-muted-foreground">
              {t('noteHint')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" className={actionButton} disabled={pending}>
              {t('confirmClose')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={actionButton}
              disabled={pending}
              onClick={() => {
                setClosing(false)
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ticket.status === 'pending' && (
            <Button
              size="sm"
              className={actionButton}
              disabled={pending}
              onClick={() => {
                setDone(null)
                submit(ticket.id, { status: 'in_progress' })
              }}
            >
              {t('take')}
            </Button>
          )}
          <Button
            variant={ticket.status === 'pending' ? 'outline' : 'default'}
            size="sm"
            className={actionButton}
            disabled={pending}
            onClick={() => {
              setDone(null)
              setClosing(true)
            }}
          >
            {t('close')}
          </Button>
        </div>
      )}
      {error !== null && (
        <p role="alert" className="pt-3 text-sm text-danger">
          {error}
        </p>
      )}
      <p role="status" className={cn('text-sm', done !== null && 'pt-3')}>
        {done}
      </p>
    </div>
  )
}
