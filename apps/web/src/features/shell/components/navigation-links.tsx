import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { isActivePath, navigationItems } from '../navigation'

export type NavigationVariant = 'bar' | 'top'

interface NavigationLinksProps {
  pathname: string
  variant: NavigationVariant
}

const listStyles: Record<NavigationVariant, string> = {
  bar: 'grid grid-cols-4',
  top: 'flex items-center gap-8',
}

const linkStyles: Record<NavigationVariant, string> = {
  bar: 'block py-4 text-center text-[15px]',
  top: 'block py-1 text-[15px]',
}

export function NavigationLinks({ pathname, variant }: NavigationLinksProps) {
  const t = useTranslations('common.navigation')

  return (
    <ul className={listStyles[variant]}>
      {navigationItems.map(({ href, key }) => {
        const active = isActivePath(pathname, href)
        return (
          <li key={href}>
            <Link
              href={href}
              prefetch
              aria-current={active ? 'page' : undefined}
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                linkStyles[variant],
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
  )
}
