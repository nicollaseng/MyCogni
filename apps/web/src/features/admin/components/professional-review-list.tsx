import type { ProfessionalForReview } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { table, TableScroll } from '@/features/professional/components/data-table'
import { formatShortDate } from '@/features/professional/dates'
import { documentFormat } from '@/features/professional/documents'
import { cn } from '@/shared/lib/utils'
import type { ReviewView } from '../review'

interface ProfessionalReviewListProps {
  professionals: readonly ProfessionalForReview[]
  view: ReviewView
  timeZone: string
}

const columns = ['name', 'kind', 'registration', 'email', 'photo', 'document', 'date'] as const

const muted = 'text-muted-foreground'

function DateCell({
  professional,
  format,
}: {
  professional: ProfessionalForReview
  format: (value: string) => string
}) {
  const t = useTranslations('admin.professionals')
  if (professional.status === 'verified' && professional.verifiedAt !== null) {
    return <>{t('verifiedAt', { date: format(professional.verifiedAt) })}</>
  }
  if (professional.status === 'rejected' && professional.reviewedAt !== null) {
    return <>{t('reviewedAt', { date: format(professional.reviewedAt) })}</>
  }
  return <>{t('createdAt', { date: format(professional.createdAt) })}</>
}

function RegistrationCell({ professional }: { professional: ProfessionalForReview }) {
  const t = useTranslations('admin.professionals')
  return (
    <span className="flex flex-col gap-0.5">
      <span className={cn(professional.registration === null && muted)}>
        {professional.registration ?? t('noRegistration')}
      </span>
      {professional.registrationNeedsReview && (
        <span className="text-[13px] font-medium text-[var(--warn)]">{t('needsReview')}</span>
      )}
    </span>
  )
}

export function ProfessionalReviewList({
  professionals,
  view,
  timeZone,
}: ProfessionalReviewListProps) {
  const t = useTranslations('admin.professionals')
  const kinds = useTranslations('common.professionalKinds')
  const locale = useLocale()
  const format = (value: string) => formatShortDate(new Date(value), timeZone, locale)

  if (professionals.length === 0) {
    return (
      <p className="rounded-[8px] bg-surface px-4 py-5 text-[15px] text-muted-foreground">
        {t(`empty.${view}`)}
      </p>
    )
  }

  return (
    <TableScroll label={t('title')}>
      <table className={cn(table.base, 'min-w-[960px]')}>
        <caption className="sr-only">{t('title')}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className={cn(table.head, column === 'name' && table.headFirst)}
              >
                {t(`columns.${column}`)}
              </th>
            ))}
            <th scope="col" className={cn(table.head, 'w-px')}>
              <span className="sr-only">{t('columns.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {professionals.map((professional) => (
            <tr key={professional.userId} aria-label={professional.fullName} className={table.row}>
              <td className={cn(table.cell, table.first, 'font-medium')}>
                {professional.fullName}
              </td>
              <td className={cn(table.cell, 'whitespace-nowrap')}>{kinds(professional.kind)}</td>
              <td className={cn(table.cell, 'whitespace-nowrap')}>
                <RegistrationCell professional={professional} />
              </td>
              <td className={cn(table.cell, 'whitespace-nowrap')}>
                {professional.email ?? <span className={muted}>{t('noEmail')}</span>}
              </td>
              <td className={cn(table.cell, 'whitespace-nowrap')}>
                {professional.hasPhoto ? (
                  t('photo.present')
                ) : (
                  <span className="text-[var(--warn)]">{t('photo.missing')}</span>
                )}
              </td>
              <td className={cn(table.cell, 'whitespace-nowrap')}>
                {professional.document === null ? (
                  <span className={muted}>{t('document.missing')}</span>
                ) : (
                  documentFormat(professional.document)
                )}
              </td>
              <td className={cn(table.cell, 'whitespace-nowrap')}>
                <DateCell professional={professional} format={format} />
              </td>
              <td className={cn(table.cell, 'py-2.5 text-right')}>
                <Link
                  href={`/admin/professionals/${professional.userId}`}
                  aria-label={t('reviewLabel', { name: professional.fullName })}
                  className="inline-flex h-8 items-center rounded-[6px] border border-rule px-3 text-sm whitespace-nowrap transition-colors hover:bg-background"
                >
                  {t('review')}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}
