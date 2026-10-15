'use client'

import { invitationLifetimeHours } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import type { Invite } from '../invites'
import { CloseIcon, PlusIcon } from './icons'
import { InviteForm } from './invite-form'
import { drawerMotion, useAnimatedDialog } from './use-animated-dialog'
import { compactButton } from './workspace'

interface InviteDialogProps {
  invite: Invite
  timeZone: string
  defaultOpen?: boolean
}

export function InviteDialog({ invite, timeZone, defaultOpen = false }: InviteDialogProps) {
  const t = useTranslations('professional.invites')
  const titleId = useId()
  const [session, setSession] = useState(0)
  const { dialog, open, close, closing, onCancel } = useAnimatedDialog({
    initiallyOpen: defaultOpen,
  })

  function start() {
    setSession((current) => current + 1)
    open()
  }

  return (
    <>
      <button type="button" className={compactButton} onClick={start}>
        <PlusIcon className="size-4" />
        {t('new')}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        data-closing={closing ? '' : undefined}
        onCancel={onCancel}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            close()
          }
        }}
        className={`m-0 ml-auto h-dvh max-h-none w-full max-w-[440px] bg-background p-0 text-foreground shadow-[-12px_0_40px_rgb(0_0_0/0.12)] starting:translate-x-full data-closing:translate-x-full ${drawerMotion}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
            <h2 id={titleId} className="font-serif text-[26px] leading-tight tracking-[-0.015em]">
              {t('form.title')}
            </h2>
            <button
              type="button"
              aria-label={t('close')}
              onClick={close}
              className="-mr-2 grid size-9 shrink-0 place-items-center rounded-[6px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-8">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('description', { hours: invitationLifetimeHours })}
            </p>
            <InviteForm key={session} invite={invite} timeZone={timeZone} />
          </div>
        </div>
      </dialog>
    </>
  )
}
