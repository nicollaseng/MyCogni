import type { ProfessionalProfile } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { formatShortDate } from '../dates'
import { documentFormat, documentStateOf, formatFileSize } from '../documents'
import { DocumentStatus } from './document-status'

interface DocumentSummaryProps {
  professional: Pick<ProfessionalProfile, 'status' | 'document'>
  timeZone: string
}

export function DocumentSummary({ professional, timeZone }: DocumentSummaryProps) {
  const t = useTranslations('verification.document')
  const locale = useLocale()
  const { document } = professional
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <div className="min-w-0 space-y-0.5">
        {document === null ? (
          <p className="text-muted-foreground">{t('title')}</p>
        ) : (
          <>
            <p className="font-medium break-all">{document.fileName}</p>
            <p className="text-sm text-muted-foreground">
              {documentFormat(document)} · {formatFileSize(document.sizeBytes, locale)} ·{' '}
              {t('sentAt', {
                date: formatShortDate(new Date(document.createdAt), timeZone, locale),
              })}
            </p>
          </>
        )}
      </div>
      <DocumentStatus state={documentStateOf(professional)} />
    </div>
  )
}
