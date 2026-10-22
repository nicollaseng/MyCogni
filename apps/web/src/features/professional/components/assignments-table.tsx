'use client'

import type { ProfessionalAssignment } from '@mycogni/contracts'
import { catalogEntryOf } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import {
  assignmentFilters,
  defaultAssignmentSort,
  filterCounts,
  isUpcoming,
  nextAssignmentSort,
  visibleAssignments,
  type AssignmentFilter,
  type AssignmentSort,
  type AssignmentSortKey,
} from '../assignment-table'
import { formatShortDate } from '../dates'
import { paginate } from '../pagination'
import { centeredTable as table, TableScroll } from './data-table'
import { FilterControl } from './filter-controls'
import { AlertIcon, SortIcon } from './icons'
import { Pager } from './pager'
import { Quiet } from './workspace'

const pageSize = 10

type Column = AssignmentSortKey | 'result' | 'repeat' | 'actions'

const columns: readonly Column[] = [
  'instrument',
  'status',
  'createdAt',
  'completedAt',
  'result',
  'repeat',
  'actions',
]

function isSortable(column: Column): column is AssignmentSortKey {
  return column !== 'result' && column !== 'repeat' && column !== 'actions'
}

interface AssignmentsTableProps {
  patientId: string
  assignments: readonly ProfessionalAssignment[]
  timeZone: string
  now: Date
  cancel: (assignmentId: string) => Promise<ActionResult<null>>
}

function Header({
  column,
  sort,
  onSort,
}: {
  column: Column
  sort: AssignmentSort
  onSort: (key: AssignmentSortKey) => void
}) {
  const t = useTranslations('assignments.table.columns')
  const active = isSortable(column) && sort.key === column
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(
        table.head,
        column === 'instrument' && table.headFirst,
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

function ResultCell({ assignment }: { assignment: ProfessionalAssignment }) {
  const t = useTranslations('assignments')
  const { result } = assignment
  if (result === null) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="font-medium">{t(`bands.${result.band}`)}</span>
      <span className="text-muted-foreground tabular-nums">
        {result.total}/{result.max}
      </span>
      {result.flags.length > 0 && <AlertIcon className="size-3.5 text-(--warn)" />}
    </span>
  )
}

export function AssignmentsTable({
  patientId,
  assignments,
  timeZone,
  now,
  cancel,
}: AssignmentsTableProps) {
  const t = useTranslations('assignments')
  const pages = useTranslations('professional.pager')
  const locale = useLocale()
  const [filter, setFilter] = useState<AssignmentFilter>('all')
  const [sort, setSort] = useState<AssignmentSort>(defaultAssignmentSort)
  const [page, setPage] = useState(1)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const rows = visibleAssignments(assignments, filter, sort)
  const current = paginate(rows, page, pageSize)
  const date = (value: string) => formatShortDate(new Date(value), timeZone, locale)

  if (assignments.length === 0) {
    return <Quiet>{t('section.empty')}</Quiet>
  }

  function confirmCancel(assignmentId: string) {
    setConfirming(null)
    startTransition(async () => {
      const result = await cancel(assignmentId)
      setFeedback(result.ok ? t('table.cancelled') : result.error)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <FilterControl
          label={t('table.filter')}
          options={assignmentFilters}
          value={filter}
          counts={filterCounts(assignments)}
          labelOf={(option) => t(`table.filters.${option}`)}
          onChange={(option) => {
            setFilter(option)
            setPage(1)
          }}
        />
        <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums md:ml-auto">
          {feedback ?? t('table.results', { count: rows.length })}
        </p>
      </div>
      {rows.length === 0 ? (
        <Quiet>{t('table.noResults')}</Quiet>
      ) : (
        <>
          <TableScroll label={t('section.title')}>
            <table className={cn(table.base, 'min-w-[860px]')}>
              <caption className="sr-only">{t('section.title')}</caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <Header
                      key={column}
                      column={column}
                      sort={sort}
                      onSort={(key) => {
                        setSort(nextAssignmentSort(sort, key))
                        setPage(1)
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.items.map((assignment) => {
                  const entry = catalogEntryOf(assignment.variant)
                  const name = assignment.variant === 'asrs6' ? t('names.asrs6') : entry.name
                  const open =
                    assignment.status === 'assigned' || assignment.status === 'in_progress'
                  return (
                    <tr key={assignment.id} className={table.row}>
                      <td className={cn(table.cell, table.first)}>
                        <span className="font-medium whitespace-nowrap">{name}</span>
                        <span className="block text-[13px] text-muted-foreground">
                          {t(`areas.${entry.area}`)}
                        </span>
                      </td>
                      <td className={table.cell}>
                        <span className="whitespace-nowrap">
                          {t(`statuses.${assignment.status}`)}
                        </span>
                        {isUpcoming(assignment, now) && (
                          <span className="block text-[13px] text-muted-foreground">
                            {t('table.upcoming', { date: date(assignment.availableFrom) })}
                          </span>
                        )}
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap')}>
                        {date(assignment.createdAt)}
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap')}>
                        {assignment.completedAt === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          date(assignment.completedAt)
                        )}
                      </td>
                      <td className={table.cell}>
                        <ResultCell assignment={assignment} />
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap')}>
                        {assignment.repeatEveryDays === null
                          ? t('table.noRepeat')
                          : t('table.repeatEvery', { days: assignment.repeatEveryDays })}
                      </td>
                      <td className={cn(table.cell, 'text-right whitespace-nowrap')}>
                        {assignment.status === 'completed' && (
                          <Link
                            href={`/pro/patients/${patientId}/questionnaires/${assignment.id}`}
                            className="text-sm underline decoration-1 underline-offset-4"
                          >
                            {t('table.open')}
                          </Link>
                        )}
                        {open && (
                          <button
                            type="button"
                            aria-label={t('table.cancelLabel', { name })}
                            onClick={() => {
                              setFeedback(null)
                              setConfirming(assignment.id)
                            }}
                            className="text-sm text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground"
                          >
                            {t('table.cancel')}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableScroll>
          <Pager
            label={pages('label', { name: t('section.title') })}
            page={current}
            onPage={setPage}
          />
        </>
      )}
      {confirming !== null && (
        <ConfirmDialog
          title={t('table.cancelTitle')}
          body={t('table.cancelBody')}
          confirmLabel={t('table.cancelConfirm')}
          cancelLabel={t('table.keep')}
          onCancel={() => {
            setConfirming(null)
          }}
          onConfirm={() => {
            confirmCancel(confirming)
          }}
        />
      )}
    </div>
  )
}
