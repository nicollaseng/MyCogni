'use client'

import type { CheckIn } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { cn } from '@/shared/lib/utils'
import { formatTime } from '@/shared/lib/time'
import { formatEntryDate } from '../dates'
import { paginate, visibleCheckIns } from '../pagination'
import { table, TableScroll } from './data-table'
import { Pager } from './pager'
import { MoodLabel } from './patient-cells'
import { Quiet } from './workspace'

interface CheckInTableProps {
  checkIns: readonly CheckIn[]
  timeZone: string
  days: number
}

const pageSize = 12

const compactCell = cn(table.cell, 'py-2.5')

function Tags({ tags, label }: { tags: readonly string[]; label: string }) {
  if (tags.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <ul aria-label={label} className="flex max-h-[3.25rem] flex-wrap gap-1 overflow-hidden">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-[4px] bg-foreground/[0.06] px-1.5 text-[13px] leading-6 whitespace-nowrap"
        >
          {tag}
        </li>
      ))}
    </ul>
  )
}

function Note({ note }: { note: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      title={note}
      aria-expanded={open}
      onClick={() => {
        setOpen((current) => !current)
      }}
      className="block w-full rounded-[4px] text-left font-serif text-[15px] leading-6 md:text-base"
    >
      <span
        className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? 'minmax(1.5rem, 1fr)' : 'minmax(1.5rem, 0fr)' }}
      >
        <span className={cn('min-h-0 overflow-hidden', open ? 'whitespace-normal' : 'truncate')}>
          {note}
        </span>
      </span>
    </button>
  )
}

export function CheckInTable({ checkIns, timeZone, days }: CheckInTableProps) {
  const t = useTranslations('professional')
  const locale = useLocale()
  const labels = useCatalogLabels()
  const [onlyNotes, setOnlyNotes] = useState(false)
  const [page, setPage] = useState(1)
  const shown = visibleCheckIns(checkIns, { onlyNotes })
  const current = paginate(shown, page, pageSize)
  const title = t('patient.entries.title', { days })

  if (checkIns.length === 0) {
    return <Quiet>{t('patient.entries.empty', { days })}</Quiet>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
          {t('patient.entries.count', { count: shown.length })}
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyNotes}
            onChange={(event) => {
              setOnlyNotes(event.currentTarget.checked)
              setPage(1)
            }}
            className="size-4 rounded-[3px] accent-primary"
          />
          {t('patient.entries.onlyNotes')}
        </label>
      </div>
      {shown.length === 0 ? (
        <Quiet>{t('patient.entries.emptyNotes', { days })}</Quiet>
      ) : (
        <>
          <TableScroll label={title} className="max-h-[480px]">
            <table className={cn(table.base, 'min-w-[820px] table-fixed')}>
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  <th scope="col" className={cn(table.head, table.headFirst, 'w-[170px]')}>
                    {t('patient.entries.when')}
                  </th>
                  <th scope="col" className={cn(table.head, 'w-[140px]')}>
                    {t('patient.entries.mood')}
                  </th>
                  <th scope="col" className={cn(table.head, 'w-[22%]')}>
                    {t('patient.entries.emotions')}
                  </th>
                  <th scope="col" className={cn(table.head, 'w-[18%]')}>
                    {t('patient.entries.contexts')}
                  </th>
                  <th scope="col" className={table.head}>
                    {t('patient.entries.note')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {current.items.map((checkIn) => {
                  const recordedAt = new Date(checkIn.recordedAt)
                  return (
                    <tr key={checkIn.id} className={table.row}>
                      <td className={cn(compactCell, table.first, 'whitespace-nowrap')}>
                        <time dateTime={checkIn.recordedAt}>
                          {formatEntryDate(recordedAt, timeZone, locale)}
                          <span aria-hidden className="text-muted-foreground">
                            {' · '}
                          </span>
                          <span className="text-muted-foreground">
                            {formatTime(recordedAt, timeZone, locale)}
                          </span>
                        </time>
                      </td>
                      <td className={cn(compactCell, 'whitespace-nowrap')}>
                        <MoodLabel level={checkIn.moodLevel} />
                      </td>
                      <td className={compactCell}>
                        <Tags
                          tags={checkIn.emotions.map(labels.emotion)}
                          label={t('patient.entries.emotions')}
                        />
                      </td>
                      <td className={compactCell}>
                        <Tags
                          tags={checkIn.contexts.map(labels.context)}
                          label={t('patient.entries.contexts')}
                        />
                      </td>
                      <td className={compactCell}>
                        {checkIn.note === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Note note={checkIn.note} />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableScroll>
          <Pager label={t('pager.label', { name: title })} page={current} onPage={setPage} />
        </>
      )}
    </div>
  )
}
