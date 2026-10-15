'use client'

import type { AdminSupportTicket } from '@mycogni/contracts'
import { supportTicketLabel, type SupportTicketStatus } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { table, TableScroll } from '@/features/professional/components/data-table'
import { SearchField } from '@/features/professional/components/filter-controls'
import { SortIcon } from '@/features/professional/components/icons'
import { Pager } from '@/features/professional/components/pager'
import { EmptyState } from '@/features/professional/components/workspace'
import { formatDateTime } from '@/features/professional/dates'
import { paginate } from '@/features/professional/pagination'
import { TicketStatus, useSubjectLabel } from '@/features/support/components/ticket-status'
import { formatRelativeTime } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import {
  defaultInboxSort,
  nextInboxSort,
  visibleTickets,
  type InboxSort,
  type InboxSortKey,
} from '../support-inbox'

const pageSize = 15

const columns = ['number', 'subject', 'requester', 'role', 'status', 'createdAt', 'age'] as const

type Column = (typeof columns)[number]

const sortable: Partial<Record<Column, InboxSortKey>> = { number: 'number', createdAt: 'createdAt' }

interface SupportInboxProps {
  tickets: readonly AdminSupportTicket[]
  status: SupportTicketStatus
  timeZone: string
}

function HeaderCell({
  column,
  sort,
  onSort,
}: {
  column: Column
  sort: InboxSort
  onSort: (key: InboxSortKey) => void
}) {
  const t = useTranslations('admin.support.columns')
  const key = sortable[column]
  const active = key !== undefined && sort.key === key
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(table.head, column === 'number' && table.headFirst)}
    >
      {key === undefined ? (
        t(column)
      ) : (
        <button
          type="button"
          onClick={() => {
            onSort(key)
          }}
          className={cn(
            'inline-flex items-center gap-1 rounded-[4px] transition-colors hover:text-foreground',
            active && 'font-medium text-foreground',
          )}
        >
          {t(column)}
          <SortIcon direction={active ? sort.direction : null} />
        </button>
      )}
    </th>
  )
}

export function SupportInbox({ tickets, status, timeZone }: SupportInboxProps) {
  const t = useTranslations('admin.support')
  const pager = useTranslations('professional.pager')
  const locale = useLocale()
  const subjectOf = useSubjectLabel()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<InboxSort>(defaultInboxSort(status))
  const [page, setPage] = useState(1)
  const [now] = useState(() => new Date())
  const rows = visibleTickets(tickets, { query, sort }, subjectOf)
  const current = paginate(rows, page, pageSize)

  if (tickets.length === 0) {
    return <EmptyState>{t(`empty.${status}`)}</EmptyState>
  }

  return (
    <div className="space-y-3">
      <SearchField
        label={t('search')}
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
      />
      {rows.length === 0 ? (
        <EmptyState>{t('noResults')}</EmptyState>
      ) : (
        <>
          <TableScroll label={t('title')}>
            <table className={cn(table.base, 'min-w-[920px]')}>
              <caption className="sr-only">{t('title')}</caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <HeaderCell
                      key={column}
                      column={column}
                      sort={sort}
                      onSort={(key) => {
                        setSort(nextInboxSort(sort, key))
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.items.map((ticket) => {
                  const label = supportTicketLabel(ticket.number)
                  return (
                    <tr key={ticket.id} aria-label={label} className={table.row}>
                      <td className={cn(table.cell, table.first, 'whitespace-nowrap tabular-nums')}>
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          className="font-medium underline decoration-1 underline-offset-4"
                        >
                          {label}
                        </Link>
                      </td>
                      <td className={cn(table.cell, 'max-w-64')}>
                        <span className="block truncate" title={subjectOf(ticket)}>
                          {subjectOf(ticket)}
                        </span>
                      </td>
                      <td className={cn(table.cell, 'max-w-64')}>
                        <span className="block truncate font-medium">
                          {ticket.requester.name ?? t('noName')}
                        </span>
                        <span className="block truncate text-[13px] text-muted-foreground">
                          {ticket.requester.email}
                        </span>
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap')}>
                        {t(`roles.${ticket.role}`)}
                      </td>
                      <td className={table.cell}>
                        <TicketStatus status={ticket.status} />
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap')}>
                        {formatDateTime(new Date(ticket.createdAt), timeZone, locale)}
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap text-muted-foreground')}>
                        {formatRelativeTime(new Date(ticket.createdAt), now, timeZone, locale)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableScroll>
          <Pager label={pager('label', { name: t('title') })} page={current} onPage={setPage} />
        </>
      )}
    </div>
  )
}
