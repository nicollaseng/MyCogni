'use client'

import type { AlertCount } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useId, useRef, useState } from 'react'
import { Avatar } from '@/shared/components/avatar'
import { Wordmark } from '@/shared/components/wordmark'
import { initialsOf } from '@/shared/lib/initials'
import { drawerMotion, useAnimatedDialog } from '@/shared/hooks/use-animated-dialog'
import { CloseIcon, MenuIcon, SettingsIcon, SignOutIcon } from './icons'
import { ProfessionalNavigation } from './professional-navigation'

interface MobileMenuProps {
  name: string
  profession: string
  photoUrl: string | null
  verified: boolean
  alerts: AlertCount | null
  signOut: () => Promise<void>
}

const entryStyle =
  'flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-left text-[15px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground'

export function MobileMenu({
  name,
  profession,
  photoUrl,
  verified,
  alerts,
  signOut,
}: MobileMenuProps) {
  const t = useTranslations('professional.shell')
  const closeButton = useRef<HTMLButtonElement>(null)
  const [expanded, setExpanded] = useState(false)
  const { dialog, open, close, closing, onCancel } = useAnimatedDialog({
    onOpen: () => {
      setExpanded(true)
      closeButton.current?.focus()
    },
  })
  const dialogId = useId()
  const titleId = useId()

  return (
    <>
      <button
        type="button"
        aria-label={t('openMenu')}
        aria-expanded={expanded}
        aria-controls={dialogId}
        onClick={open}
        className="-ml-2 grid size-10 place-items-center rounded-[6px] text-foreground transition-colors hover:bg-foreground/[0.06]"
      >
        <MenuIcon className="size-5" />
      </button>
      <dialog
        ref={dialog}
        id={dialogId}
        aria-labelledby={titleId}
        data-closing={closing ? '' : undefined}
        onCancel={onCancel}
        onClose={() => {
          setExpanded(false)
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            close()
          }
        }}
        className={`m-0 mr-auto h-dvh max-h-none w-[min(20rem,86vw)] max-w-none bg-surface p-0 text-foreground shadow-[12px_0_40px_rgb(0_0_0/0.14)] starting:-translate-x-full data-closing:-translate-x-full ${drawerMotion}`}
      >
        <div className="flex h-full flex-col px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="space-y-1">
              <Wordmark />
              <p id={titleId} className="text-sm text-muted-foreground">
                {t('area')}
              </p>
            </div>
            <button
              ref={closeButton}
              type="button"
              aria-label={t('closeMenu')}
              onClick={close}
              className="grid size-10 place-items-center rounded-[6px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <CloseIcon />
            </button>
          </div>
          {verified && (
            <div className="mt-7">
              <ProfessionalNavigation variant="drawer" alerts={alerts} onNavigate={close} />
            </div>
          )}
          <div className="mt-auto space-y-1 pt-6">
            <div className="flex items-center gap-3 px-3 pb-2">
              <Avatar src={photoUrl} initials={initialsOf(name)} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{name}</p>
                <p className="truncate text-[13px] text-muted-foreground">{profession}</p>
              </div>
            </div>
            <Link href="/pro/settings" onClick={close} className={entryStyle}>
              <SettingsIcon />
              {t('settings')}
            </Link>
            <form action={signOut}>
              <button type="submit" className={entryStyle}>
                <SignOutIcon />
                {t('signOut')}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}
