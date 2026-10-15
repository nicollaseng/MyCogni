'use client'

import type { ProfessionalAlert } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Avatar } from '@/shared/components/avatar'
import { initialsOf } from '@/shared/lib/initials'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  alertLevelFilters,
  alertStatusFilters,
  defaultAlertSort,
  levelCounts,
  nextAlertSort,
  statusCounts,
  visibleAlerts,
  type AlertLevelFilter,
  type AlertSort,
  type AlertSortKey,
  type AlertStatusFilter,
} from '../alert-table'
import { paginate } from '../pagination'
import {
  ActionFeedback,
  AlertButtons,
  AlertLevelLabel,
  AlertStatusLabel,
  useAlertActions,
  type AlertActions,
} from './alert-cells'
import { table, TableScroll } from './data-table'
import { FilterControl, SearchField } from './filter-controls'
import { SortIcon } from './icons'
import { Pager } from './pager'
import { RelativeTime } from './patient-cells'
import { EmptyState } from './workspace'

const pageSize = 15

type Column = AlertSortKey | 'reason' | 'actions'

const columns: readonly Column[] = ['patient', 'reason', 'level', 'createdAt', 'status', 'actions']

function isSortable(column: Column): column is AlertSortKey {
  return column !== 'reason' && column !== 'actions'
}

interface AlertsTableProps extends AlertActions {
  alerts: readonly ProfessionalAlert[]
  now: Date
  timeZone: string
}

function Header({
  column,
  sort,
  onSort,
}: {
  column: Column
  sort: AlertSort
  onSort: (key: AlertSortKey) => void
}) {
  const t = useTranslations('alerts.columns')
  const active = isSortable(column) && sort.key === column
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(
        table.head,
        column === 'patient' && cn(table.headFirst, 'min-w-48'),
        column === 'actions' && 'w-px text-right',
      )}
    >
      {column === 'actions' ? (
        <span className="sr-only">{t('actions')}</span>
      ) : isSortable(column) ? (
        <button
          type="button"
          onClick={() => {
            onSort(column)
          }}
          className={cn(
            'inline-flex items-center gap-1 rounded-[4px] transition-colors hover:text-foreground',
            active && 'font-medium text-foreground',
          )}
        >
          {t(column)}
          <SortIcon direction={active ? sort.direction : null} />
        </button>
      ) : (
        t(column)
      )}
    </th>
  )
}

export function AlertsTable({ alerts, now, timeZone, acknowledge, resolve }: AlertsTableProps) {
  const t = useTranslations('alerts')
  const pages = useTranslations('professional.pager')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<AlertLevelFilter>('all')
  const [status, setStatus] = useState<AlertStatusFilter>('pending')
  const [sort, setSort] = useState<AlertSort>(defaultAlertSort)
  const [page, setPage] = useState(1)
  const actions = useAlertActions({ acknowledge, resolve })
  const rows = visibleAlerts(alerts, { level, status, query, sort })
  const current = paginate(rows, page, pageSize)

  if (alerts.length === 0) {
    return <EmptyState>{t('empty')}</EmptyState>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <SearchField
          label={t('search')}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
        />
        <FilterControl
          label={t('statusFilter')}
          options={alertStatusFilters}
          value={status}
          counts={statusCounts(alerts)}
          labelOf={(option) => t(`statusFilters.${option}`)}
          onChange={(option) => {
            setStatus(option)
            setPage(1)
          }}
        />
        <FilterControl
          label={t('levelFilter')}
          options={alertLevelFilters}
          value={level}
          counts={levelCounts(alerts, status)}
          labelOf={(option) => t(`levelFilters.${option}`)}
          onChange={(option) => {
            setLevel(option)
            setPage(1)
          }}
        />
        <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums xl:ml-auto">
          {t('results', { count: rows.length })}
        </p>
      </div>
      <ActionFeedback state={actions} />

      {rows.length === 0 ? (
        <EmptyState
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 text-sm"
              onClick={() => {
                setQuery('')
                setLevel('all')
                setStatus('all')
                setPage(1)
              }}
            >
              {t('clear')}
            </Button>
          }
        >
          {t('noResults')}
        </EmptyState>
      ) : (
        <>
          <TableScroll label={t('title')}>
            <table className={cn(table.base, 'min-w-[880px]')}>
              <caption className="sr-only">{t('title')}</caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <Header
                      key={column}
                      column={column}
                      sort={sort}
                      onSort={(key) => {
                        setSort((value) => nextAlertSort(value, key))
                        setPage(1)
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.items.map((alert) => {
                  const name = alert.patientName ?? t('unnamed')
                  return (
                    <tr
                      key={alert.id}
                      onClick={(event) => {
                        if (
                          event.target instanceof Element &&
                          event.target.closest('a, button') === null
                        ) {
                          event.currentTarget.querySelector('a')?.click()
                        }
                      }}
                      className={cn(table.row, 'cursor-pointer')}
                    >
                      <td className={cn(table.cell, table.first)}>
                        <span className="flex items-center gap-3">
                          <Avatar
                            src={alert.patientPhotoUrl}
                            initials={initialsOf(alert.patientName)}
                            size="xs"
                          />
                          <Link
                            href={`/pro/patients/${alert.patientId}`}
                            className="font-medium decoration-1 underline-offset-4 hover:underline"
                          >
                            {name}
                          </Link>
                        </span>
                      </td>
                      <td
                        className={cn(
                          table.cell,
                          alert.status === 'resolved' && 'text-muted-foreground',
                        )}
                      >
                        {t(`reasons.${alert.reason}`)}
                      </td>
                      <td className={table.cell}>
                        <AlertLevelLabel level={alert.level} />
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap')}>
                        <RelativeTime date={alert.createdAt} now={now} timeZone={timeZone} />
                      </td>
                      <td className={table.cell}>
                        <AlertStatusLabel status={alert.status} />
                      </td>
                      <td className={cn(table.cell, 'py-2.5')}>
                        <AlertButtons alert={alert} name={name} state={actions} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableScroll>
          <Pager label={pages('label', { name: t('title') })} page={current} onPage={setPage} />
        </>
      )}
    </div>
  )
}
