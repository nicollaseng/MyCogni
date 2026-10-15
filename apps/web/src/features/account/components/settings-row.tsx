'use client'

import { useTranslations } from 'next-intl'
import { createContext, useContext, useId, useState, type ReactNode } from 'react'
import { DisclosurePanel } from '@/shared/components/disclosure'

const CloseRow = createContext<() => void>(() => undefined)

export function useCloseRow(): () => void {
  return useContext(CloseRow)
}

interface SettingsRowProps {
  label: string
  value: string
  children: ReactNode
}

export function SettingsRow({ label, value, children }: SettingsRowProps) {
  const t = useTranslations('account.settings')
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(0)
  const panelId = useId()

  return (
    <div className="py-3.5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate">{value}</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            if (!open) {
              setOpened(opened + 1)
            }
            setOpen(!open)
          }}
          className="shrink-0 text-sm underline decoration-1 underline-offset-4"
        >
          {open ? t('cancel') : t('change', { field: label.toLowerCase() })}
        </button>
      </div>
      <DisclosurePanel id={panelId} open={open} className="pt-4">
        <CloseRow.Provider
          key={opened}
          value={() => {
            setOpen(false)
          }}
        >
          {children}
        </CloseRow.Provider>
      </DisclosurePanel>
    </div>
  )
}
