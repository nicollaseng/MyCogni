import type { ProfessionalReviewEntry } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { table, TableScroll } from '@/features/professional/components/data-table'
import { formatDateTime } from '@/features/professional/dates'
import { cn } from '@/shared/lib/utils'

interface ReviewHistoryProps {
  history: readonly ProfessionalReviewEntry[]
  timeZone: string
}

const columns = ['date', 'decision', 'note', 'admin'] as const

export function ReviewHistory({ history, timeZone }: ReviewHistoryProps) {
  const t = useTranslations('admin.professionals.detail.history')
  const locale = useLocale()

  if (history.length === 0) {
    return (
      <p className="rounded-[8px] bg-surface px-4 py-5 text-[15px] text-muted-foreground">
        {t('empty')}
      </p>
    )
  }

  return (
    <TableScroll label={t('title')}>
      <table className={cn(table.base, 'min-w-[640px]')}>
        <caption className="sr-only">{t('title')}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className={cn(table.head, column === 'date' && table.headFirst)}
              >
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id} className={table.row}>
              <td className={cn(table.cell, table.first, 'whitespace-nowrap')}>
                {formatDateTime(new Date(entry.createdAt), timeZone, locale)}
              </td>
              <td
                className={cn(
                  table.cell,
                  'whitespace-nowrap',
                  entry.decision === 'rejected' && 'text-[var(--warn)]',
                )}
              >
                {t(`decisions.${entry.decision}`)}
              </td>
              <td className={cn(table.cell, 'max-w-[28rem] text-pretty')}>
                {entry.note ?? <span className="text-muted-foreground">—</span>}
              </td>
              <td className={cn(table.cell, 'break-all')}>
                {entry.adminEmail ?? (
                  <span className="text-muted-foreground">{t('removedAdmin')}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}
