import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LotusIcon } from '@/shared/components/icons'
import { cn } from '@/shared/lib/utils'
import { isActivePath, navigationItems, type NavigationItem } from '../navigation'

export type NavigationVariant = 'bar' | 'top'

interface NavigationLinksProps {
  pathname: string
  variant: NavigationVariant
}

const listStyles: Record<NavigationVariant, string> = {
  bar: 'grid grid-cols-5 items-stretch',
  top: 'flex items-center gap-7',
}

const linkStyles: Record<NavigationVariant, string> = {
  bar: 'flex h-full items-center justify-center py-4 text-center text-[15px]',
  top: 'block py-1 text-[15px]',
}

const activeStyles = 'font-medium text-foreground underline decoration-2 underline-offset-[10px]'

function ZenLink({
  href,
  variant,
  active,
}: {
  href: NavigationItem['href']
  variant: NavigationVariant
  active: boolean
}) {
  const t = useTranslations('common.navigation')

  if (variant === 'bar') {
    return (
      <Link
        href={href}
        prefetch
        aria-current={active ? 'page' : undefined}
        data-zen-tab
        className="flex h-full items-center justify-center px-1.5 py-1.5"
      >
        <span
          className={cn(
            '-mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-lg bg-zen px-2 pt-2.5 pb-2 text-zen-foreground transition-colors duration-150 motion-reduce:transition-none',
            active && 'outline-2 outline-offset-2 outline-zen',
          )}
        >
          <LotusIcon className="size-5" />
          <span
            className={cn('text-[13px] leading-none', active ? 'font-semibold' : 'font-medium')}
          >
            {t('zen')}
          </span>
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? 'page' : undefined}
      data-zen-tab
      className={cn(
        'flex items-center gap-1.5 py-1 text-[15px] text-emphasis transition-colors hover:text-foreground',
        active && 'font-medium underline decoration-2 underline-offset-[10px]',
      )}
    >
      <LotusIcon className="size-4" />
      {t('zen')}
    </Link>
  )
}

export function NavigationLinks({ pathname, variant }: NavigationLinksProps) {
  const t = useTranslations('common.navigation')

  return (
    <ul className={listStyles[variant]}>
      {navigationItems.map(({ href, key }) => {
        const active = isActivePath(pathname, href)
        return (
          <li key={href}>
            {key === 'zen' ? (
              <ZenLink href={href} variant={variant} active={active} />
            ) : (
              <Link
                href={href}
                prefetch
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground transition-colors hover:text-foreground',
                  linkStyles[variant],
                  active && activeStyles,
                )}
              >
                {t(key)}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
