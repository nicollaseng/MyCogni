'use client'

import { crisisLinesFor } from '@mycogni/domain'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Chevron, DisclosurePanel } from '@/shared/components/disclosure'
import { usePopoverMenu } from '@/shared/hooks/use-popover-menu'
import { initialsOf } from '@/shared/lib/initials'
import { cn } from '@/shared/lib/utils'
import { headerDropdownStyle, menuItemStyle } from '@/shared/ui/menu'

interface AvatarProps {
  initials: string
  photoUrl: string | null
  className: string
}

function Avatar({ initials, photoUrl, className }: AvatarProps) {
  if (photoUrl !== null) {
    return (
      <Image
        src={photoUrl}
        alt=""
        width={40}
        height={40}
        loading="eager"
        decoding="async"
        unoptimized
        className={cn('shrink-0 rounded-full object-cover', className)}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-sage pt-[0.14em] font-serif leading-none text-foreground',
        className,
      )}
    >
      {initials}
    </span>
  )
}

function CrisisLines({ open, id }: { open: boolean; id: string }) {
  const help = useTranslations('common.help')
  const lines = crisisLinesFor(useLocale())

  return (
    <DisclosurePanel id={id} open={open}>
      <div role="group" aria-label={help('summary')} className="space-y-0.5 pb-1 pl-2.5">
        <p className="px-2.5 pt-0.5 pb-1 text-[13px] leading-snug text-pretty text-muted-foreground">
          {help('intro')}
        </p>
        {lines.map((line) => (
          <a
            key={line.phone}
            href={`tel:${line.phone}`}
            role="menuitem"
            tabIndex={-1}
            className={cn(menuItemStyle, 'items-baseline gap-3 py-1.5')}
          >
            <span className="shrink-0 font-medium text-help tabular-nums">{line.display}</span>
            <span className="min-w-0 text-[13px] leading-snug text-muted-foreground">
              {line.description}
            </span>
          </a>
        ))}
      </div>
    </DisclosurePanel>
  )
}

interface AccountPanelProps {
  name: string | null
  email: string | null
  initials: string
  photoUrl: string | null
  signOut: () => Promise<void>
  onNavigate: () => void
}

function AccountPanel({ name, email, initials, photoUrl, signOut, onNavigate }: AccountPanelProps) {
  const t = useTranslations('common.account')
  const [helpOpen, setHelpOpen] = useState(false)
  const helpId = useId()

  return (
    <>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar initials={initials} photoUrl={photoUrl} className="size-10 text-[16px]" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">{name ?? email}</p>
          {name !== null && email !== null && (
            <p className="truncate text-[13px] text-muted-foreground">{email}</p>
          )}
        </div>
      </div>
      <div role="menu" aria-label={t('menu')} className="border-t border-rule p-1">
        <Link
          href="/me"
          prefetch
          role="menuitem"
          tabIndex={-1}
          onClick={onNavigate}
          className={menuItemStyle}
        >
          {t('profile')}
        </Link>
        <Link
          href="/me#professionals"
          prefetch
          role="menuitem"
          tabIndex={-1}
          onClick={onNavigate}
          className={menuItemStyle}
        >
          {t('professionals')}
        </Link>
        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          aria-expanded={helpOpen}
          aria-controls={helpId}
          onClick={() => {
            setHelpOpen((value) => !value)
          }}
          className={cn(menuItemStyle, 'justify-between text-help')}
        >
          {t('help')}
          <Chevron open={helpOpen} />
        </button>
        <CrisisLines open={helpOpen} id={helpId} />
        <div role="separator" className="mx-1.5 my-1 h-px bg-rule" />
        <form action={signOut}>
          <button type="submit" role="menuitem" tabIndex={-1} className={menuItemStyle}>
            {t('signOut')}
          </button>
        </form>
      </div>
    </>
  )
}

interface AccountMenuProps {
  name: string | null
  email: string | null
  photoUrl?: string | null
  signOut: () => Promise<void>
}

export function AccountMenu({ name, email, photoUrl = null, signOut }: AccountMenuProps) {
  const t = useTranslations('common.account')
  const { open, mounted, closing, close, triggerProps, panelProps } = usePopoverMenu()
  const initials = initialsOf(name, email)

  return (
    <div className="-my-2">
      <button
        {...triggerProps}
        aria-label={t('open')}
        className="grid size-10 shrink-0 place-items-center rounded-full"
      >
        <Avatar
          initials={initials}
          photoUrl={photoUrl}
          className={cn(
            'size-8 text-[14px] transition-shadow',
            open ? 'ring-2 ring-foreground/20' : 'hover:ring-2 hover:ring-foreground/10',
          )}
        />
      </button>
      {mounted && (
        <div {...panelProps} className={headerDropdownStyle(closing, 'sm:w-72')}>
          <AccountPanel
            name={name}
            email={email}
            initials={initials}
            photoUrl={photoUrl}
            signOut={signOut}
            onNavigate={() => {
              close(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
