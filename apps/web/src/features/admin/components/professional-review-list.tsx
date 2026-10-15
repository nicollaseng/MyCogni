'use client'

import type { ProfessionalForReview } from '@mycogni/contracts'
import type { ProfessionalStatus } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useState, type ReactNode } from 'react'
import { formatShortDate } from '@/features/professional/dates'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
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

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
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
  const { submit, pending, error } = useSubmit(
    async (decision: Decision): Promise<ActionResult<Decision>> => {
      const result = await review(decision.userId, decision.status)
      return result.ok ? { ok: true, value: decision } : result
    },
    setDone,
  )

  function decide(professional: ProfessionalForReview, status: ReviewDecision) {
    setDone(null)
    submit({ userId: professional.userId, name: professional.fullName, status })
  }

  return (
    <div className="space-y-3">
      {error !== null && (
        <p role="alert" className="px-1 text-sm text-danger">
          {error}
        </p>
      )}
      {done !== null && (
        <p role="status" className="px-1 text-sm">
          {t(done.status === 'verified' ? 'approved' : 'rejected', { name: done.name })}
        </p>
      )}
      {professionals.length === 0 ? (
        <p className="px-1 text-muted-foreground">{t(`empty.${status}`)}</p>
      ) : (
        <ul className="space-y-3">
          {professionals.map((professional) => (
            <li
              key={professional.userId}
              aria-label={professional.fullName}
              className="space-y-4 rounded-[22px] bg-surface px-5 py-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-serif text-2xl leading-tight">{professional.fullName}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('createdAt', {
                    date: formatShortDate(new Date(professional.createdAt), timeZone, locale),
                  })}
                  {professional.verifiedAt !== null &&
                    ` · ${t('reviewedAt', {
                      date: formatShortDate(new Date(professional.verifiedAt), timeZone, locale),
                    })}`}
                </p>
              </div>
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
                <Fact label={t('kind')}>{kinds(professional.kind)}</Fact>
                <Fact label={t('registration')}>
                  {professional.registration ?? t('noRegistration')}
                </Fact>
                <Fact label={t('email')}>{professional.email ?? t('noEmail')}</Fact>
              </dl>
              <div className="flex flex-wrap gap-2">
                {professional.status !== 'verified' && (
                  <Button
                    size="sm"
                    shape="pill"
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
                    shape="pill"
                    disabled={pending}
                    onClick={() => {
                      decide(professional, 'rejected')
                    }}
                  >
                    {t('reject')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
