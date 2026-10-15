'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ComponentType } from 'react'
import { cn } from '@/shared/lib/utils'
import { InvitesIcon, OverviewIcon, PatientsIcon } from './icons'

export type NavigationVariant = 'sidebar' | 'drawer' | 'bottom'

interface Item {
  href: Route
  key: 'overview' | 'patients' | 'invites'
  icon: ComponentType<{ className?: string }>
  matches: (pathname: string) => boolean
}

const items: readonly Item[] = [
  { href: '/pro', key: 'overview', icon: OverviewIcon, matches: (pathname) => pathname === '/pro' },
  {
    href: '/pro/patients',
    key: 'patients',
    icon: PatientsIcon,
    matches: (pathname) => pathname.startsWith('/pro/patients'),
  },
  {
    href: '/pro/invites',
    key: 'invites',
    icon: InvitesIcon,
    matches: (pathname) => pathname.startsWith('/pro/invites'),
  },
]

const listStyles: Record<NavigationVariant, string> = {
  sidebar: 'space-y-0.5',
  drawer: 'space-y-0.5',
  bottom: 'grid grid-cols-3',
}

function linkStyle(variant: NavigationVariant, active: boolean): string {
  if (variant === 'bottom') {
    return cn(
      'flex flex-col items-center gap-1 pt-2.5 pb-2 text-[12px] transition-colors',
      active ? 'font-medium text-foreground' : 'text-muted-foreground',
    )
  }
  return cn(
    'flex items-center gap-3 rounded-[6px] px-3 py-2 text-[15px] transition-colors',
    active
      ? 'bg-foreground/[0.07] font-medium text-foreground'
      : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
  )
}

interface ProfessionalNavigationProps {
  variant: NavigationVariant
  onNavigate?: () => void
}

export function ProfessionalNavigation({ variant, onNavigate }: ProfessionalNavigationProps) {
  const t = useTranslations('professional.shell')
  const pathname = usePathname()

  return (
    <nav aria-label={t('navigation')}>
      <ul className={listStyles[variant]}>
        {items.map(({ href, key, icon: ItemIcon, matches }) => {
          const active = matches(pathname)
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                className={linkStyle(variant, active)}
              >
                <ItemIcon className={cn(variant === 'bottom' && 'size-5')} />
                {t(key)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
