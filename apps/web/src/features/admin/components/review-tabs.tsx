import { professionalStatuses, type ProfessionalStatus } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

export function ReviewTabs({ current }: { current: ProfessionalStatus }) {
  const t = useTranslations('admin.professionals.tabs')

  return (
    <nav aria-label={t('label')}>
      <ul className="flex w-fit rounded-[6px] border border-rule bg-background/50 p-0.5">
        {professionalStatuses.map((status) => {
          const active = status === current
          return (
            <li key={status}>
              <Link
                href={{ pathname: '/admin/professionals', query: { status } }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-[4px] px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-surface font-medium text-foreground shadow-[0_0_0_1px_var(--rule)]'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(status)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
