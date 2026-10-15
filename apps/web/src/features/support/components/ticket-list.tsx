import type { SupportTicket } from '@mycogni/contracts'
import { supportTicketLabel } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatShortDate } from '@/features/professional/dates'
import { TicketStatus, useSubjectLabel } from './ticket-status'

interface TicketListProps {
  tickets: readonly SupportTicket[]
  timeZone: string
}

export function TicketList({ tickets, timeZone }: TicketListProps) {
  const t = useTranslations('support.section')
  const locale = useLocale()
  const subjectOf = useSubjectLabel()

  if (tickets.length === 0) {
    return <p className="py-3.5 text-muted-foreground">{t('empty')}</p>
  }

  return (
    <ul aria-label={t('mine')} className="-mx-2.5 space-y-1 py-1.5">
      {tickets.map((ticket) => {
        const label = supportTicketLabel(ticket.number)
        return (
          <li key={ticket.id}>
            <Link
              href={`/support/${ticket.id}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 rounded-[6px] px-2.5 py-2.5 transition-colors hover:bg-foreground/[0.04]"
            >
              <span className="min-w-0 truncate">{subjectOf(ticket)}</span>
              <span className="text-sm">
                <TicketStatus status={ticket.status} />
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {label} · {formatShortDate(new Date(ticket.createdAt), timeZone, locale)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
