import type { PatientAssignment } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { firstAvailable } from '../run'

export function AssignedCard({ open }: { open: readonly PatientAssignment[] }) {
  const t = useTranslations('questionnaires')
  const first = firstAvailable(open)
  if (first === undefined) {
    return null
  }
  const started = first.status === 'in_progress'

  return (
    <section
      aria-label={t('card.title')}
      className="space-y-4 rounded-lg bg-surface px-5 py-5 sm:px-6"
    >
      <div className="space-y-1.5">
        <h2 className="font-serif text-[22px] leading-tight tracking-[-0.01em] text-balance">
          {t('card.title')}
        </h2>
        <p className="text-[15px] text-muted-foreground">
          {t(`areas.${first.area}`)} ·{' '}
          {t('size', { count: first.itemCount, minutes: first.minutes })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href={`/questionnaires/${first.id}`}
          className={cn(buttonVariants({ size: 'sm' }), 'px-5')}
        >
          {started ? t('card.resume') : t('card.open')}
        </Link>
        {open.length > 1 && (
          <p className="text-sm text-muted-foreground">
            {t('card.more', { count: open.length - 1 })}{' '}
            <Link href="/me/questionnaires" className="underline decoration-1 underline-offset-4">
              {t('card.all')}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
