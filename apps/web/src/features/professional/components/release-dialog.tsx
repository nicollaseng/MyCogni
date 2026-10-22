'use client'

import type { QuestionnaireCatalog } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { drawerMotion, useAnimatedDialog } from '@/shared/hooks/use-animated-dialog'
import { CloseIcon, PlusIcon } from './icons'
import { ReleaseForm, type ReleaseAction } from './release-form'
import { compactButton } from './workspace'

interface ReleaseDialogProps {
  catalog: QuestionnaireCatalog
  release: ReleaseAction
}

export function ReleaseDialog({ catalog, release }: ReleaseDialogProps) {
  const t = useTranslations('assignments')
  const titleId = useId()
  const [session, setSession] = useState(0)
  const [released, setReleased] = useState(false)
  const { dialog, open, close, closing, onCancel } = useAnimatedDialog({ initiallyOpen: false })

  function start() {
    setSession((current) => current + 1)
    setReleased(false)
    open()
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {released && (
        <p role="status" className="text-sm text-muted-foreground">
          {t('dialog.released')}
        </p>
      )}
      <button type="button" className={compactButton} onClick={start}>
        <PlusIcon className="size-4" />
        {t('section.release')}
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
        className={`m-0 ml-auto h-dvh max-h-none w-full max-w-[460px] bg-background p-0 text-foreground shadow-[-12px_0_40px_rgb(0_0_0/0.12)] starting:translate-x-full data-closing:translate-x-full ${drawerMotion}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
            <h2 id={titleId} className="font-serif text-[26px] leading-tight tracking-[-0.015em]">
              {t('dialog.title')}
            </h2>
            <button
              type="button"
              aria-label={t('dialog.close')}
              onClick={close}
              className="-mr-2 grid size-9 shrink-0 place-items-center rounded-[6px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-8">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('dialog.description')}
            </p>
            <ReleaseForm
              key={session}
              catalog={catalog}
              release={release}
              onReleased={() => {
                setReleased(true)
                close()
              }}
            />
          </div>
        </div>
      </dialog>
    </div>
  )
}
