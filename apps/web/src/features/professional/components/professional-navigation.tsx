'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

interface Item {
  href: Route
  key: 'patients' | 'invites'
  matches: (pathname: string) => boolean
}

const items: readonly Item[] = [
  {
    href: '/pro',
    key: 'patients',
    matches: (pathname) => pathname === '/pro' || pathname.startsWith('/pro/patients/'),
  },
  {
    href: '/pro/invites',
    key: 'invites',
    matches: (pathname) => pathname.startsWith('/pro/invites'),
  },
]

export function ProfessionalNavigation() {
  const t = useTranslations('professional.shell')
  const pathname = usePathname()

  return (
    <nav aria-label={t('navigation')}>
      <ul className="flex items-center gap-7">
        {items.map(({ href, key, matches }) => {
          const active = matches(pathname)
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block py-1 text-[15px] text-muted-foreground transition-colors hover:text-foreground',
                  active &&
                    'font-medium text-foreground underline decoration-2 underline-offset-[10px]',
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
