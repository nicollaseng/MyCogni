'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Sheet } from '@/shared/components/sheet'
import type { AssistantActions } from '../model'
import { AssistantChat } from './assistant-chat'
import { AskIcon } from './assistant-launcher'

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
        onClick={() => {
          setOpen(true)
        }}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[6px] px-2.5 text-[15px] font-medium transition-colors hover:bg-surface"
      >
        <AskIcon />
        {t('launcher')}
      </button>
      {open && (
        <Sheet
          title={t('title')}
          closeLabel={t('close')}
          onClose={() => {
            setOpen(false)
          }}
        >
          {() => (
            <AssistantChat
              target={{ mode: 'personal', entryId }}
              actions={actions}
              timeZone={timeZone}
              prepare={prepare}
            />
          )}
        </Sheet>
      )}
    </>
  )
}
