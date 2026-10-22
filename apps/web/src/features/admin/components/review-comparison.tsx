import type { ProfessionalReviewDetail } from '@mycogni/contracts'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { formatShortDate } from '@/features/professional/dates'
import { documentFormat, formatFileSize } from '@/features/professional/documents'
import { compactButton, Surface } from '@/features/professional/components/workspace'
import { cn } from '@/shared/lib/utils'
import { councilSearches } from '../review'

interface ReviewComparisonProps {
  professional: ProfessionalReviewDetail
  timeZone: string
}

const photoSize = 288

const inlineLink = 'underline decoration-1 underline-offset-4'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

function Photo({ professional }: { professional: ProfessionalReviewDetail }) {
  const t = useTranslations('admin.professionals.detail')
  const common = useTranslations('common')
  return (
    <figure className="space-y-2">
      {professional.photoUrl === null ? (
        <div className="grid aspect-square w-full max-w-72 place-items-center rounded-[8px] bg-[var(--warn-soft)] p-5 text-center text-sm text-pretty text-[var(--warn)]">
          {t('noPhoto')}
        </div>
      ) : (
        <Image
          src={professional.photoUrl}
          alt={common('photoOf', { name: professional.fullName })}
          width={photoSize}
          height={photoSize}
          unoptimized
          className="aspect-square w-full max-w-72 rounded-[8px] bg-sage object-cover"
        />
      )}
      <figcaption className="text-sm text-muted-foreground">{t('photo')}</figcaption>
    </figure>
  )
}

export function ReviewComparison({ professional, timeZone }: ReviewComparisonProps) {
  const t = useTranslations('admin.professionals')
  const kinds = useTranslations('common.professionalKinds')
  const locale = useLocale()
  const format = (value: string) => formatShortDate(new Date(value), timeZone, locale)
  const { document, council } = professional
  const status =
    professional.status === 'verified' && professional.verifiedAt !== null
      ? t('detail.statuses.verified', { date: format(professional.verifiedAt) })
      : t(`detail.statuses.${professional.status === 'rejected' ? 'rejected' : 'pending'}`)

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <Surface className="p-4 sm:p-5">
        <Photo professional={professional} />
      </Surface>
      <Surface className="space-y-5 p-4 sm:p-5">
        <div className="space-y-2">
          <h3 className="text-sm text-muted-foreground">{t('detail.document')}</h3>
          {document === null ? (
            <p className="text-[var(--warn)]">{t('detail.noDocument')}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={`/admin/documents/${document.id}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('document.openLabel', { name: professional.fullName })}
                className={compactButton}
              >
                {t('document.openDocument')}
              </a>
              <span className="text-sm text-muted-foreground">
                {documentFormat(document)} · {formatFileSize(document.sizeBytes, locale)} ·{' '}
                {t('document.sentAt', { date: format(document.createdAt) })}
              </span>
            </div>
          )}
        </div>
        <dl className="space-y-3">
          <Fact label={t('detail.facts.kind')}>{kinds(professional.kind)}</Fact>
          <Fact label={t('detail.facts.registration')}>
            <span className="block">{professional.registration ?? t('noRegistration')}</span>
            {professional.registrationNeedsReview && (
              <span className="block text-sm text-pretty text-[var(--warn)]">
                {t('detail.needsReview')}
              </span>
            )}
            {council !== null && (
              <a
                href={councilSearches[council]}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('text-sm', inlineLink)}
              >
                {t(`detail.search.${council}`)}
              </a>
            )}
          </Fact>
          <Fact label={t('detail.facts.email')}>
            {professional.email ?? <span className="text-muted-foreground">{t('noEmail')}</span>}
          </Fact>
          <Fact label={t('detail.facts.status')}>{status}</Fact>
          <Fact label={t('detail.facts.createdAt')}>{format(professional.createdAt)}</Fact>
        </dl>
      </Surface>
    </div>
  )
}
