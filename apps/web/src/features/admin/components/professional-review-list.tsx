'use client'

import type { ProfessionalForReview } from '@mycogni/contracts'
import type { ProfessionalStatus } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { table, TableScroll } from '@/features/professional/components/data-table'
import { formatShortDate } from '@/features/professional/dates'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { Review, ReviewDecision } from '../review'

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

const columns = ['name', 'kind', 'registration', 'email', 'createdAt'] as const

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
  const { submit, pending, error } = useSubmit(
    async (decision: Decision): Promise<ActionResult<Decision>> => {
      const result = await review(decision.userId, decision.status)
      return result.ok ? { ok: true, value: decision } : result
    },
    setDone,
  )
  const format = (value: string) => formatShortDate(new Date(value), timeZone, locale)

  function decide(professional: ProfessionalForReview, decision: ReviewDecision) {
    setDone(null)
    submit({ userId: professional.userId, name: professional.fullName, status: decision })
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
          <table className={cn(table.base, 'min-w-[860px]')}>
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
                <tr
                  key={professional.userId}
                  aria-label={professional.fullName}
                  className={table.row}
                >
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
                  <td className={cn(table.cell, 'whitespace-nowrap')}>
                    {format(professional.createdAt)}
                    {professional.verifiedAt !== null && (
                      <span className="block text-[13px] text-muted-foreground">
                        {t('reviewedAt', { date: format(professional.verifiedAt) })}
                      </span>
                    )}
                  </td>
                  <td className={cn(table.cell, 'py-2.5')}>
                    <div className="flex justify-end gap-1.5">
                      {professional.status !== 'verified' && (
                        <Button
                          size="sm"
                          className="h-8 px-3 text-sm"
                          disabled={pending}
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
                          className="h-8 px-3 text-sm hover:bg-background"
                          disabled={pending}
                          onClick={() => {
                            decide(professional, 'rejected')
                          }}
                        >
                          {t('reject')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  )
}
