'use client'

import type { Assessment } from '@mycogni/contracts'
import { instruments } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { formatShortDate } from '../dates'
import { paginate } from '../pagination'
import { table, TableScroll } from './data-table'
import { AlertIcon } from './icons'
import { Pager } from './pager'
import { Quiet } from './workspace'

interface QuestionnaireTableProps {
  assessments: readonly Assessment[]
  timeZone: string
}

const pageSize = 8

const columns = ['date', 'instrument', 'score', 'severity', 'item9'] as const

function RiskItem({ assessment }: { assessment: Assessment }) {
  const t = useTranslations('professional.patient.screenings')
  if (assessment.instrument !== 'phq9') {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">{t('notApplicable')}</span>
      </span>
    )
  }
  if (!assessment.hasRiskFlag) {
    return <span className="text-muted-foreground">{t('negative')}</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-(--warn)">
      <AlertIcon className="size-3.5" />
      {t('positive')}
    </span>
  )
}

export function QuestionnaireTable({ assessments, timeZone }: QuestionnaireTableProps) {
  const t = useTranslations('professional')
  const screening = useTranslations('screening')
  const locale = useLocale()
  const [page, setPage] = useState(1)
  const ordered = [...assessments].sort((first, second) =>
    second.completedAt.localeCompare(first.completedAt),
  )
  const current = paginate(ordered, page, pageSize)
  const title = t('patient.screenings.title')

  if (ordered.length === 0) {
    return <Quiet>{t('patient.screenings.empty')}</Quiet>
  }

  return (
    <div className="space-y-3">
      <TableScroll label={title}>
        <table className={cn(table.base, 'min-w-[620px]')}>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    table.head,
                    column === 'date' && table.headFirst,
                    column === 'score' && 'text-right',
                  )}
                >
                  {t(`patient.screenings.${column}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.items.map((assessment) => (
              <tr key={assessment.id} className={table.row}>
                <td className={cn(table.cell, table.first, 'whitespace-nowrap')}>
                  {formatShortDate(new Date(assessment.completedAt), timeZone, locale)}
                </td>
                <td className={table.cell}>
                  <span className="font-medium">{instruments[assessment.instrument].name}</span>
                  <span className="block text-[13px] text-muted-foreground">
                    {screening(`topics.${assessment.instrument}`)}
                  </span>
                </td>
                <td className={cn(table.cell, table.numeric)}>
                  <span className="font-medium">{assessment.totalScore}</span>
                  <span className="text-muted-foreground">/{assessment.maxScore}</span>
                </td>
                <td className={table.cell}>{screening(`severity.${assessment.severity}`)}</td>
                <td className={table.cell}>
                  <RiskItem assessment={assessment} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
      <Pager label={t('pager.label', { name: title })} page={current} onPage={setPage} />
    </div>
  )
}
