import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

export function RiskMarker({ className }: { className?: string }) {
  const t = useTranslations('professional.risk')
  return (
    <p
      className={cn(
        'inline-flex w-fit items-center gap-2 rounded-full bg-danger/10 px-3 py-1 text-sm font-medium text-danger',
        className,
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-danger" />
      {t('label')}
    </p>
  )
}
