'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Sheet } from '@/shared/components/sheet'
import { showsAssistant, type AssistantActions, type AssistantTarget } from '../model'
import { AssistantChat } from './assistant-chat'

interface LauncherProps {
  actions: AssistantActions
  timeZone: string
}

const personal: AssistantTarget = { mode: 'personal' }

export function AskIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-[18px]">
      <path
        d="M4 4.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9l-3.5 3v-3H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AssistantEntry({
  pathname,
  actions,
  timeZone,
}: LauncherProps & { pathname: string }) {
  const t = useTranslations('assistant')
  const [open, setOpen] = useState(false)

  return (
    <>
      {showsAssistant(pathname) && (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setOpen(true)
          }}
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 inline-flex h-11 items-center gap-2 rounded-[8px] bg-primary pr-4 pl-3.5 text-[15px] font-medium text-primary-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_16px_rgb(0_0_0/0.08)] transition-colors hover:bg-primary/90 motion-reduce:transition-none sm:right-6 sm:bottom-6"
        >
          <AskIcon />
          {t('launcher')}
        </button>
      )}
      {open && (
        <Sheet
          title={t('title')}
          closeLabel={t('close')}
          onClose={() => {
            setOpen(false)
          }}
        >
          {() => <AssistantChat target={personal} actions={actions} timeZone={timeZone} />}
        </Sheet>
      )}
    </>
  )
}

export function AssistantLauncher(props: LauncherProps) {
  return <AssistantEntry pathname={usePathname()} {...props} />
}
