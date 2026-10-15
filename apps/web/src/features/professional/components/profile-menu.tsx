'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Avatar } from '@/shared/components/avatar'
import { usePopoverMenu } from '@/shared/hooks/use-popover-menu'
import { initialsOf } from '@/shared/lib/initials'
import { cn } from '@/shared/lib/utils'
import { menuItemStyle, menuSurface } from '@/shared/ui/menu'
import { SettingsIcon, SignOutIcon, SupportIcon } from './icons'

export type ProfileMenuPlacement = 'sidebar' | 'header'

interface ProfileMenuProps {
  name: string
  profession: string
  photoUrl: string | null
  signOut: () => Promise<void>
  placement?: ProfileMenuPlacement
}

const triggerStyles: Record<ProfileMenuPlacement, string> = {
  sidebar: 'w-full gap-3 px-3 py-2.5',
  header: 'max-w-64 gap-2.5 p-1.5 sm:pr-2.5',
}

const panelStyles: Record<ProfileMenuPlacement, { open: string; closing: string }> = {
  sidebar: {
    open: 'right-0 bottom-full left-0 mb-1.5 origin-bottom starting:translate-y-1',
    closing: 'translate-y-1',
  },
  header: {
    open: 'top-full right-0 mt-1.5 w-56 origin-top-right starting:-translate-y-1',
    closing: '-translate-y-1',
  },
}

export function ProfileMenu({
  name,
  profession,
  photoUrl,
  signOut,
  placement = 'sidebar',
}: ProfileMenuProps) {
  const t = useTranslations('professional.shell')
  const { open, mounted, closing, close, triggerProps, panelProps } = usePopoverMenu()
  const panel = panelStyles[placement]

  return (
    <div className="relative">
      <button
        {...triggerProps}
        className={cn(
          'flex items-center rounded-[6px] text-left transition-colors hover:bg-foreground/[0.05]',
          triggerStyles[placement],
          open && 'bg-foreground/[0.06]',
        )}
      >
        <Avatar src={photoUrl} initials={initialsOf(name)} size="sm" eager />
        <span className={cn('min-w-0 flex-1', placement === 'header' && 'max-sm:sr-only')}>
          <span className="block truncate text-[15px] font-medium">{name}</span>
          {placement === 'sidebar' && (
            <span className="block truncate text-[13px] text-muted-foreground">{profession}</span>
          )}
        </span>
      </button>
      {mounted && (
        <div
          {...panelProps}
          role="menu"
          aria-label={t('accountMenu')}
          className={cn(
            menuSurface,
            'absolute p-1 starting:scale-[0.98] starting:opacity-0',
            panel.open,
            closing && cn('pointer-events-none scale-[0.98] opacity-0 ease-in', panel.closing),
          )}
        >
          <Link
            href="/pro/settings"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              close(false)
            }}
            className={menuItemStyle}
          >
            <SettingsIcon className="size-4 text-muted-foreground" />
            {t('settings')}
          </Link>
          <Link
            href="/pro/settings#support"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              close(false)
            }}
            className={menuItemStyle}
          >
            <SupportIcon className="size-4 text-muted-foreground" />
            {t('support')}
          </Link>
          <form action={signOut}>
            <button type="submit" role="menuitem" tabIndex={-1} className={menuItemStyle}>
              <SignOutIcon className="size-4 text-muted-foreground" />
              {t('signOut')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
