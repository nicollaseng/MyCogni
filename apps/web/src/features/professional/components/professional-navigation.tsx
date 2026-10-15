'use client'

import type { AlertCount } from '@mycogni/contracts'
import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ComponentType } from 'react'
import { cn } from '@/shared/lib/utils'
import { AlertsIcon, InvitesIcon, OverviewIcon, PatientsIcon } from './icons'

export type NavigationVariant = 'sidebar' | 'drawer' | 'bottom'

interface Item {
  href: Route
  key: 'overview' | 'patients' | 'alerts' | 'invites'
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
    href: '/pro/alerts',
    key: 'alerts',
    icon: AlertsIcon,
    matches: (pathname) => pathname.startsWith('/pro/alerts'),
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
  bottom: 'grid grid-cols-4',
}

function linkStyle(variant: NavigationVariant, active: boolean): string {
  if (variant === 'bottom') {
    return cn(
      'relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[12px] transition-colors',
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

function PendingCount({ alerts, variant }: { alerts: AlertCount; variant: NavigationVariant }) {
  return (
    <span
      aria-hidden
      className={cn(
        'leading-none font-medium tabular-nums',
        alerts.urgent > 0 ? 'text-danger' : 'text-foreground',
        variant === 'bottom'
          ? 'absolute top-1.5 left-[calc(50%+10px)] text-[11px]'
          : 'ml-auto pl-2 text-[13px]',
      )}
    >
      {alerts.pending}
    </span>
  )
}

interface ProfessionalNavigationProps {
  variant: NavigationVariant
  alerts: AlertCount | null
  onNavigate?: () => void
}

export function ProfessionalNavigation({
  variant,
  alerts,
  onNavigate,
}: ProfessionalNavigationProps) {
  const t = useTranslations('professional.shell')
  const pending = useTranslations('alerts.navigation')
  const pathname = usePathname()
  const counted = alerts !== null && alerts.pending > 0 ? alerts : null

  return (
    <nav aria-label={t('navigation')}>
      <ul className={listStyles[variant]}>
        {items.map(({ href, key, icon: ItemIcon, matches }) => {
          const active = matches(pathname)
          const count = key === 'alerts' ? counted : null
          return (
            <li key={key}>
              <Link
                href={href}
                prefetch
                aria-current={active ? 'page' : undefined}
                aria-label={
                  count === null
                    ? undefined
                    : `${t(key)}, ${pending('pending', { count: count.pending })}`
                }
                onClick={onNavigate}
                className={linkStyle(variant, active)}
              >
                <ItemIcon className={cn(variant === 'bottom' && 'size-5')} />
                {t(key)}
                {count !== null && <PendingCount alerts={count} variant={variant} />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
