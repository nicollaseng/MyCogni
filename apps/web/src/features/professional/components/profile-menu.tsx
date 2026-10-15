'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Avatar } from '@/shared/components/avatar'
import { usePopoverMenu } from '@/shared/hooks/use-popover-menu'
import { initialsOf } from '@/shared/lib/initials'
import { cn } from '@/shared/lib/utils'
import { menuItemStyle, menuSurface } from '@/shared/ui/menu'
import { SettingsIcon, SignOutIcon, SupportIcon } from './icons'

interface ProfileMenuProps {
  name: string
  profession: string
  photoUrl: string | null
  signOut: () => Promise<void>
}

export function ProfileMenu({ name, profession, photoUrl, signOut }: ProfileMenuProps) {
  const t = useTranslations('professional.shell')
  const { open, mounted, closing, close, triggerProps, panelProps } = usePopoverMenu()

  return (
    <div className="relative">
      <button
        {...triggerProps}
        className={cn(
          'flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.05]',
          open && 'bg-foreground/[0.06]',
        )}
      >
        <Avatar src={photoUrl} initials={initialsOf(name)} size="sm" eager />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{name}</span>
          <span className="block truncate text-[13px] text-muted-foreground">{profession}</span>
        </span>
      </button>
      {mounted && (
        <div
          {...panelProps}
          role="menu"
          aria-label={t('accountMenu')}
          className={cn(
            menuSurface,
            'absolute right-0 bottom-full left-0 mb-1.5 origin-bottom p-1 starting:translate-y-1 starting:scale-[0.98] starting:opacity-0',
            closing && 'pointer-events-none translate-y-1 scale-[0.98] opacity-0 ease-in',
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
