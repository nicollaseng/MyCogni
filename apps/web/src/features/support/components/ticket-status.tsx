import type { SupportTicket } from '@mycogni/contracts'
import type { SupportTicketStatus } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

export const statusDots: Readonly<Record<SupportTicketStatus, string>> = {
  pending: 'bg-help',
  in_progress: 'bg-emphasis',
  closed: 'bg-muted-foreground/50',
}

export function TicketStatus({ status }: { status: SupportTicketStatus }) {
  const t = useTranslations('support.statuses')
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', statusDots[status])} />
      {t(status)}
    </span>
  )
}

export type SubjectOf = (ticket: Pick<SupportTicket, 'subject' | 'customSubject'>) => string

export function useSubjectLabel(): SubjectOf {
  const t = useTranslations('support.subjects')
  return (ticket) => ticket.customSubject ?? t(ticket.subject)
}
