'use client'

import type { ProfessionalForReview } from '@mycogni/contracts'
import type { ProfessionalStatus } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useState } from 'react'
import { table, TableScroll } from '@/features/professional/components/data-table'
import { formatShortDate } from '@/features/professional/dates'
import { documentFormat, formatFileSize } from '@/features/professional/documents'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { Review, ReviewDecision } from '../review'
import { RejectForm } from './reject-form'

interface ProfessionalReviewListProps {
  professionals: readonly ProfessionalForReview[]
  status: ProfessionalStatus
  timeZone: string
  review: Review
}

interface Decision {
  userId: string
  name: string
  status: ReviewDecision
}

const columns = ['name', 'kind', 'registration', 'email', 'document', 'createdAt'] as const

const columnCount = columns.length + 1

const actionButton = 'h-8 px-3 text-sm'

function DocumentCell({ professional }: { professional: ProfessionalForReview }) {
  const t = useTranslations('admin.professionals.document')
  const locale = useLocale()
  const { document } = professional
  if (document === null) {
    return <span className="text-muted-foreground">{t('missing')}</span>
  }
  return (
    <span className="flex flex-col gap-0.5">
      <a
        href={`/admin/documents/${document.id}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('openLabel', { name: professional.fullName })}
        className="w-fit font-medium underline decoration-1 underline-offset-4"
      >
        {t('open')}
      </a>
      <span className="text-[13px] whitespace-nowrap text-muted-foreground">
        {documentFormat(document)} · {formatFileSize(document.sizeBytes, locale)}
      </span>
    </span>
  )
}

function ReviewDetails({
  professional,
  format,
}: {
  professional: ProfessionalForReview
  format: (value: string) => string
}) {
  const t = useTranslations('admin.professionals')
  const reviewedAt = professional.reviewedAt ?? professional.verifiedAt
  return (
    <>
      {reviewedAt !== null && (
        <span className="block text-[13px] text-muted-foreground">
          {t('reviewedAt', { date: format(reviewedAt) })}
        </span>
      )}
      {professional.status === 'rejected' && professional.reviewNote !== null && (
        <span className="block max-w-64 text-[13px] whitespace-normal text-muted-foreground">
          {t('note', { note: professional.reviewNote })}
        </span>
      )}
    </>
  )
}

export function ProfessionalReviewList({
  professionals,
  status,
  timeZone,
  review,
}: ProfessionalReviewListProps) {
  const t = useTranslations('admin.professionals')
  const kinds = useTranslations('common.professionalKinds')
  const locale = useLocale()
  const [done, setDone] = useState<Decision | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const { submit, pending, error } = useSubmit(
    async (decision: Decision, note?: string): Promise<ActionResult<Decision>> => {
      const result = await review(
        decision.userId,
        decision.status === 'rejected'
          ? { status: 'rejected', note: note ?? '' }
          : { status: 'verified' },
      )
      return result.ok ? { ok: true, value: decision } : result
    },
    (decision) => {
      setRejecting(null)
      setDone(decision)
    },
  )
  const format = (value: string) => formatShortDate(new Date(value), timeZone, locale)

  function decide(professional: ProfessionalForReview, decision: ReviewDecision, note?: string) {
    setDone(null)
    submit({ userId: professional.userId, name: professional.fullName, status: decision }, note)
  }

  return (
    <div className="space-y-3">
      <div className="min-h-5 text-sm">
        {error !== null ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : (
          done !== null && (
            <p role="status">
              {t(done.status === 'verified' ? 'approved' : 'rejected', { name: done.name })}
            </p>
          )
        )}
      </div>
      {professionals.length === 0 ? (
        <p className="rounded-[8px] bg-surface px-4 py-5 text-[15px] text-muted-foreground">
          {t(`empty.${status}`)}
        </p>
      ) : (
        <TableScroll label={t('title')}>
          <table className={cn(table.base, 'min-w-[980px]')}>
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
                <Fragment key={professional.userId}>
                  <tr aria-label={professional.fullName} className={table.row}>
                    <td className={cn(table.cell, table.first, 'font-medium')}>
                      {professional.fullName}
                    </td>
                    <td className={cn(table.cell, 'whitespace-nowrap')}>
                      {kinds(professional.kind)}
                    </td>
                    <td className={cn(table.cell, 'whitespace-nowrap')}>
                      {professional.registration ?? (
                        <span className="text-muted-foreground">{t('noRegistration')}</span>
                      )}
                    </td>
                    <td className={cn(table.cell, 'break-all')}>
                      {professional.email ?? (
                        <span className="text-muted-foreground">{t('noEmail')}</span>
                      )}
                    </td>
                    <td className={table.cell}>
                      <DocumentCell professional={professional} />
                    </td>
                    <td className={cn(table.cell, 'whitespace-nowrap')}>
                      {format(professional.createdAt)}
                      <ReviewDetails professional={professional} format={format} />
                    </td>
                    <td className={cn(table.cell, 'py-2.5')}>
                      <div className="flex justify-end gap-1.5">
                        {professional.status !== 'verified' && (
                          <Button
                            size="sm"
                            className={actionButton}
                            disabled={pending || professional.document === null}
                            onClick={() => {
                              decide(professional, 'verified')
                            }}
                          >
                            {t('approve')}
                          </Button>
                        )}
                        {professional.status !== 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(actionButton, 'hover:bg-background')}
                            disabled={pending}
                            aria-expanded={rejecting === professional.userId}
                            onClick={() => {
                              setDone(null)
                              setRejecting(professional.userId)
                            }}
                          >
                            {t('reject')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {rejecting === professional.userId && (
                    <tr className={table.row}>
                      <td colSpan={columnCount} className={cn(table.cell, 'pl-4')}>
                        <RejectForm
                          name={professional.fullName}
                          pending={pending}
                          onReject={(note) => {
                            decide(professional, 'rejected', note)
                          }}
                          onCancel={() => {
                            setRejecting(null)
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  )
}
