'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import type { SafetyPrompt } from '../model'
import { SafetyPanel } from './safety-panel'

interface SafetyNoticeProps {
  prompt: SafetyPrompt
  className?: string
}

export function SafetyNotice({ prompt, className }: SafetyNoticeProps) {
  const t = useTranslations('safety')
  const [open, setOpen] = useState(true)
  const reopen = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      reopen.current?.focus()
    }
  }, [open])

  return (
    <div className={className}>
      {open ? (
        <SafetyPanel
          level="urgent"
          professionals={prompt.professionals}
          onDismiss={() => {
            setOpen(false)
          }}
        />
      ) : (
        <button
          ref={reopen}
          type="button"
          onClick={() => {
            setOpen(true)
          }}
          className="inline-flex h-8 items-center text-sm font-medium text-help underline decoration-1 underline-offset-4"
        >
          {t('reopen')}
        </button>
      )}
    </div>
  )
}
