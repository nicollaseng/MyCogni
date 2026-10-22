'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { SparklesIcon } from '@/shared/components/icons'
import { Sheet } from '@/shared/components/sheet'
import type { AssistantActions } from '../model'
import { AssistantChat } from './assistant-chat'

interface PageAssistantProps {
  entryId: string
  actions: AssistantActions
  timeZone: string
  prepare: () => Promise<unknown>
}

export function PageAssistant({ entryId, actions, timeZone, prepare }: PageAssistantProps) {
  const t = useTranslations('assistant')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={t('launcherLabel')}
        onClick={() => {
          setOpen(true)
        }}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[6px] px-2.5 text-[15px] font-medium transition-colors hover:bg-surface"
      >
        <SparklesIcon className="size-[18px]" />
        {t('launcher')}
      </button>
      {open && (
        <Sheet
          bare
          onClose={() => {
            setOpen(false)
          }}
        >
          {(close, titleId) => (
            <AssistantChat
              target={{ mode: 'personal', entryId }}
              actions={actions}
              timeZone={timeZone}
              titleId={titleId}
              onClose={close}
              prepare={prepare}
            />
          )}
        </Sheet>
      )}
    </>
  )
}
