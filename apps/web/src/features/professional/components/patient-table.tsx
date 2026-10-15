'use client'

import type { PatientSummary } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState, type ReactNode } from 'react'
import { initialsOf } from '@/features/account/avatar'
import { Avatar } from '@/shared/components/avatar'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { paginate } from '../pagination'
import {
  defaultSort,
  filterCounts,
  nextSort,
  patientFilters,
  visiblePatients,
  type PatientFilter,
  type SortKey,
  type SortState,
} from '../patient-table'
import { latestScreenings } from '../screenings'
import { table, TableScroll } from './data-table'
import { Pager } from './pager'
import { FilterControl, SearchField } from './filter-controls'
import { SortIcon } from './icons'
import {
  AttentionReasons,
  LastCheckIn,
  MoodAverage,
  ScreeningScore,
  SinceDate,
} from './patient-cells'
import { EmptyState, quietButton } from './workspace'

interface PatientTableProps {
  patients: readonly PatientSummary[]
  initialFilter: PatientFilter
  now: Date
  timeZone: string
}

const pageSize = 15

const columns: readonly SortKey[] = [
  'name',
  'lastCheckIn',
  'week',
  'mood',
  'phq9',
  'gad7',
  'attention',
]

const columnStyles: Partial<Record<SortKey, string>> = {
  name: 'min-w-56',
  week: 'text-right',
  attention: 'min-w-56',
}

function SortHeader({
  column,
  sort,
  onSort,
}: {
  column: SortKey
  sort: SortState
  onSort: (key: SortKey) => void
}) {
  const t = useTranslations('professional.patients.columns')
  const active = sort.key === column
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(table.head, column === 'name' && table.headFirst, columnStyles[column])}
    >
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
    </th>
  )
}

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn(table.cell, className)}>{children}</td>
}

function PatientRow({
  patient,
  now,
  timeZone,
}: {
  patient: PatientSummary
  now: Date
  timeZone: string
}) {
  const t = useTranslations('professional.patients')
  const latest = latestScreenings(patient.screenings)

  return (
    <tr
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a, button') === null) {
          event.currentTarget.querySelector('a')?.click()
        }
      }}
      className={cn(table.row, 'cursor-pointer')}
    >
      <Cell className={table.first}>
        <span className="flex items-start gap-3">
          <Avatar
            src={patient.photoUrl}
            initials={initialsOf(patient.name, null)}
            size="sm"
            className="mt-0.5"
          />
          <span className="min-w-0">
            <Link
              href={`/pro/patients/${patient.id}`}
              className="font-medium decoration-1 underline-offset-4 hover:underline"
            >
              {patient.name ?? t('unnamed')}
            </Link>
            <span className="mt-0.5 block text-[13px] whitespace-nowrap text-muted-foreground">
              <SinceDate startedAt={patient.startedAt} timeZone={timeZone} />
            </span>
          </span>
        </span>
      </Cell>
      <Cell className="whitespace-nowrap">
        <LastCheckIn lastCheckIn={patient.lastCheckIn} now={now} timeZone={timeZone} />
      </Cell>
      <Cell className={table.numeric}>
        <span className={cn(patient.checkInsLastWeek === 0 && 'text-muted-foreground')}>
          {patient.checkInsLastWeek}
        </span>
      </Cell>
      <Cell className="whitespace-nowrap">
        <MoodAverage average={patient.moodAverage} previous={patient.previousMoodAverage} />
      </Cell>
      <Cell className="whitespace-nowrap">
        <ScreeningScore screening={latest.phq9} />
      </Cell>
      <Cell className="whitespace-nowrap">
        <ScreeningScore screening={latest.gad7} />
      </Cell>
      <Cell>
        <AttentionReasons reasons={patient.attention} />
      </Cell>
    </tr>
  )
}

export function PatientTable({ patients, initialFilter, now, timeZone }: PatientTableProps) {
  const t = useTranslations('professional')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PatientFilter>(initialFilter)
  const [sort, setSort] = useState<SortState>(defaultSort)
  const [page, setPage] = useState(1)
  const rows = visiblePatients(patients, { query, filter, sort })
  const current = paginate(rows, page, pageSize)

  if (patients.length === 0) {
    return (
      <EmptyState
        title={t('patients.emptyTitle')}
        action={
          <Link href={{ pathname: '/pro/invites', query: { new: '1' } }} className={quietButton}>
            {t('patients.firstInvite')}
          </Link>
        }
      >
        {t('patients.emptyBody')}
      </EmptyState>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <SearchField
          label={t('patients.search')}
          placeholder={t('patients.searchPlaceholder')}
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
        />
        <FilterControl
          label={t('patients.filter')}
          options={patientFilters}
          value={filter}
          counts={filterCounts(patients)}
          labelOf={(option) => t(`patients.filters.${option}`)}
          onChange={(option) => {
            setFilter(option)
            setPage(1)
          }}
        />
        <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums lg:ml-auto">
          {t('patients.results', { count: rows.length })}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 text-sm"
              onClick={() => {
                setQuery('')
                setFilter('all')
                setPage(1)
              }}
            >
              {t('patients.clear')}
            </Button>
          }
        >
          {t('patients.noResults')}
        </EmptyState>
      ) : (
        <>
          <TableScroll label={t('patients.title')}>
            <table className={cn(table.base, 'min-w-[860px]')}>
              <caption className="sr-only">{t('patients.title')}</caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <SortHeader
                      key={column}
                      column={column}
                      sort={sort}
                      onSort={(key) => {
                        setSort((value) => nextSort(value, key))
                        setPage(1)
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.items.map((patient) => (
                  <PatientRow
                    key={patient.linkId}
                    patient={patient}
                    now={now}
                    timeZone={timeZone}
                  />
                ))}
              </tbody>
            </table>
          </TableScroll>
          <Pager
            label={t('pager.label', { name: t('patients.title') })}
            page={current}
            onPage={setPage}
          />
        </>
      )}
    </div>
  )
}
