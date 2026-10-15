'use client'

import type { ProfessionalInsight } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import type { PeriodLabeled } from '@/features/insights/readings'
import { Chevron, DisclosurePanel } from '@/shared/components/disclosure'
import { cn } from '@/shared/lib/utils'
import { table, TableScroll } from './data-table'
import { AttentionLevel, ReadingDetail } from './reading-detail'

interface ReadingRowsProps {
  reading: ProfessionalInsight
  period: string
  open: boolean
  onToggle: () => void
}

const wide = 'max-sm:hidden'

function ReadingRows({ reading, period, open, onToggle }: ReadingRowsProps) {
  const t = useTranslations('insights.professional')
  const panelId = useId()
  return (
    <>
      <tr className={table.row}>
        <td className={cn(table.cell, 'pl-4')}>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
            className="flex w-full cursor-pointer items-start gap-2 rounded-[4px] text-left"
          >
            <Chevron open={open} className="mt-[3px] text-muted-foreground" />
            <span className="min-w-0">
              {period}
              <span className="mt-1 flex flex-wrap items-center gap-x-3 text-sm sm:hidden">
                <AttentionLevel level={reading.content.attention} />
                <span className="text-muted-foreground">
                  {t('records', { count: reading.checkInCount })}
                </span>
              </span>
            </span>
          </button>
        </td>
        <td className={cn(table.cell, wide)}>
          <AttentionLevel level={reading.content.attention} />
        </td>
        <td className={cn(table.cell, table.numeric, wide)}>{reading.checkInCount}</td>
      </tr>
      <tr>
        <td colSpan={3} className="bg-surface p-0">
          <DisclosurePanel id={panelId} open={open} className="px-4 pt-1 pb-6 sm:pl-10">
            <ReadingDetail content={reading.content} withLevel={false} heading="h4" />
          </DisclosurePanel>
        </td>
      </tr>
    </>
  )
}

export function ReadingsTable({
  readings,
}: {
  readings: readonly PeriodLabeled<ProfessionalInsight>[]
}) {
  const t = useTranslations('insights.professional')
  const [open, setOpen] = useState<string | null>(null)

  return (
    <TableScroll label={t('earlier')} className="max-h-[420px]">
      <table className={table.base}>
        <caption className="sr-only">{t('earlier')}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(table.head, 'pl-4')}>
              {t('columns.period')}
            </th>
            <th scope="col" className={cn(table.head, wide, 'w-[32%]')}>
              {t('columns.attention')}
            </th>
            <th scope="col" className={cn(table.head, wide, 'w-[18%] text-right')}>
              {t('columns.records')}
            </th>
          </tr>
        </thead>
        <tbody>
          {readings.map(({ reading, period }) => (
            <ReadingRows
              key={reading.id}
              reading={reading}
              period={period}
              open={open === reading.id}
              onToggle={() => {
                setOpen(open === reading.id ? null : reading.id)
              }}
            />
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}
