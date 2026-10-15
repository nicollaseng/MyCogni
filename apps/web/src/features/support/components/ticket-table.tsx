import type { SupportTicket } from '@mycogni/contracts'
import { supportTicketLabel } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { table, TableScroll } from '@/features/professional/components/data-table'
import { Quiet } from '@/features/professional/components/workspace'
import { formatShortDate } from '@/features/professional/dates'
import { cn } from '@/shared/lib/utils'
import { TicketStatus, useSubjectLabel } from './ticket-status'

const columns = ['number', 'subject', 'status', 'createdAt'] as const

interface TicketTableProps {
  tickets: readonly SupportTicket[]
  timeZone: string
}

export function TicketTable({ tickets, timeZone }: TicketTableProps) {
  const t = useTranslations('support.section')
  const locale = useLocale()
  const subjectOf = useSubjectLabel()

  if (tickets.length === 0) {
    return <Quiet>{t('empty')}</Quiet>
  }

  return (
    <TableScroll label={t('mine')}>
      <table className={cn(table.base, 'min-w-[560px]')}>
        <caption className="sr-only">{t('mine')}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className={cn(table.head, column === 'number' && table.headFirst)}
              >
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const label = supportTicketLabel(ticket.number)
            return (
              <tr key={ticket.id} className={table.row}>
                <td className={cn(table.cell, table.first, 'whitespace-nowrap tabular-nums')}>
                  <Link
                    href={`/pro/support/${ticket.id}`}
                    aria-label={t('open', { ticket: label })}
                    className="font-medium underline decoration-1 underline-offset-4"
                  >
                    {label}
                  </Link>
                </td>
                <td className={cn(table.cell, 'max-w-72 truncate')}>{subjectOf(ticket)}</td>
                <td className={table.cell}>
                  <TicketStatus status={ticket.status} />
                </td>
                <td className={cn(table.cell, 'whitespace-nowrap')}>
                  {formatShortDate(new Date(ticket.createdAt), timeZone, locale)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TableScroll>
  )
}
