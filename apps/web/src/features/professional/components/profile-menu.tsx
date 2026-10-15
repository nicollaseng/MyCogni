'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/shared/lib/utils'
import { SettingsIcon, SignOutIcon } from './icons'
import { usePresence } from './use-animated-dialog'
import { initialsOf } from '../initials'

interface ProfileMenuProps {
  name: string
  profession: string
  signOut: () => Promise<void>
}

function menuItems(element: HTMLElement | null): HTMLElement[] {
  return Array.from(element?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
}

const itemStyle =
  'flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-[15px] outline-none hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.08] focus-visible:outline-none'

export function ProfileMenu({ name, profession, signOut }: ProfileMenuProps) {
  const t = useTranslations('professional.shell')
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const { mounted, closing } = usePresence(open, 150)

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) {
      trigger.current?.focus()
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }
    menuItems(menu.current)[0]?.focus()
    function onPointer(event: PointerEvent) {
      const target = event.target
      if (
        target instanceof Node &&
        !menu.current?.contains(target) &&
        !trigger.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const list = menuItems(menu.current)
    const index = list.findIndex((item) => item === document.activeElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
    } else if (event.key === 'Tab') {
      setOpen(false)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      list[(index + step + list.length) % list.length]?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      list[event.key === 'Home' ? 0 : list.length - 1]?.focus()
    }
  }

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setOpen((value) => !value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className={cn(
          'flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.05]',
          open && 'bg-foreground/[0.06]',
        )}
      >
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-sm font-medium text-foreground"
        >
          {initialsOf(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{name}</span>
          <span className="block truncate text-[13px] text-muted-foreground">{profession}</span>
        </span>
      </button>
      {mounted && (
        <div
          ref={menu}
          id={menuId}
          role="menu"
          aria-label={t('accountMenu')}
          onKeyDown={onMenuKey}
          className={cn(
            'absolute right-0 bottom-full left-0 z-30 mb-1.5 origin-bottom rounded-[8px] border border-rule bg-background p-1 shadow-[0_8px_28px_rgb(0_0_0/0.12)] transition-[opacity,translate,scale] duration-150 ease-out starting:translate-y-1 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none',
            closing && 'pointer-events-none translate-y-1 scale-[0.98] opacity-0 ease-in',
          )}
        >
          <Link
            href="/pro/settings"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              setOpen(false)
            }}
            className={itemStyle}
          >
            <SettingsIcon className="size-4 text-muted-foreground" />
            {t('settings')}
          </Link>
          <form action={signOut}>
            <button type="submit" role="menuitem" tabIndex={-1} className={itemStyle}>
              <SignOutIcon className="size-4 text-muted-foreground" />
              {t('signOut')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
