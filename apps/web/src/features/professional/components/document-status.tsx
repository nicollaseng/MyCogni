import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import type { DocumentState } from '../documents'

const dots: Readonly<Record<DocumentState, string>> = {
  missing: 'bg-muted-foreground/60',
  pending: 'bg-(--warn)',
  verified: 'bg-emphasis',
  rejected: 'bg-danger',
}

export function DocumentStatus({ state }: { state: DocumentState }) {
  const t = useTranslations('verification.document.status')
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', dots[state])} />
      {t(state)}
    </span>
  )
}
