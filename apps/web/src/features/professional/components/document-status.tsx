import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import type { DocumentState } from '../documents'

const dots: Readonly<Record<DocumentState, string>> = {
  missing: 'bg-muted-foreground/60',
  pending: 'bg-(--warn)',
  verified: 'bg-emphasis',
  rejected: 'bg-danger',
}

interface DocumentStatusProps {
  state: DocumentState
  label?: string
}

export function DocumentStatus({ state, label }: DocumentStatusProps) {
  const t = useTranslations('verification.document.status')
  return (
    <span
      className={cn('inline-flex items-center gap-2', label === undefined && 'whitespace-nowrap')}
    >
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', dots[state])} />
      {label ?? t(state)}
    </span>
  )
}
