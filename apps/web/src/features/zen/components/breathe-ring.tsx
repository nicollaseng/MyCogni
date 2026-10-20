'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { BreathingSheet } from './breathe-button'

export function BreatheRing() {
  const t = useTranslations('zen')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
        }}
        className="group flex min-h-24 w-full items-center gap-5 rounded-lg bg-mist px-5 py-4 text-left text-foreground transition-[filter] duration-150 hover:brightness-[0.98] motion-reduce:transition-none sm:w-auto sm:min-w-[22rem] dark:hover:brightness-110"
      >
        <span aria-hidden className="relative flex size-16 shrink-0 items-center justify-center">
          <svg viewBox="0 0 64 64" className="absolute inset-0 size-full text-help">
            <circle cx="32" cy="32" r="31" fill="none" stroke="currentColor" strokeOpacity="0.22" />
            <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeOpacity="0.32" />
          </svg>
          <span className="block size-10 animate-zen-breath rounded-full border-[1.5px] border-help bg-help/15 motion-reduce:animate-none" />
        </span>
        <span className="text-[17px] font-medium">{t('quickBreathe')}</span>
      </button>
      {open && (
        <BreathingSheet
          onClose={() => {
            setOpen(false)
          }}
        />
      )}
    </>
  )
}
