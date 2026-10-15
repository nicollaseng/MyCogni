import { professionalStatuses, type ProfessionalStatus } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

export function ReviewTabs({ current }: { current: ProfessionalStatus }) {
  const t = useTranslations('admin.professionals.tabs')

  return (
    <nav aria-label={t('label')}>
      <ul className="flex w-fit gap-1 rounded-full bg-sage p-1">
        {professionalStatuses.map((status) => {
          const active = status === current
          return (
            <li key={status}>
              <Link
                href={{ pathname: '/admin/professionals', query: { status } }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-full px-4 py-2 text-[15px] transition-colors',
                  active
                    ? 'bg-background font-medium shadow-sm'
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
