'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

const areas: readonly { key: 'professionals' | 'support'; href: Route }[] = [
  { key: 'professionals', href: '/admin/professionals' },
  { key: 'support', href: '/admin/support' },
]

export function AdminNavigation() {
  const t = useTranslations('admin.shell')
  const pathname = usePathname()

  return (
    <nav aria-label={t('navigation')} className="ml-auto">
      <ul className="flex items-center gap-1">
        {areas.map(({ key, href }) => {
          const active = pathname.startsWith(href)
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-[6px] px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-foreground/[0.07] font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                )}
              >
                {t(key)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
