'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

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
  const [open, setOpen] = useState(false)

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
          onClick={() => {
            setOpen(!open)
          }}
          className="shrink-0 text-sm underline decoration-1 underline-offset-4"
        >
          {open ? 'Cancelar' : `Alterar ${label.toLowerCase()}`}
        </button>
      </div>
      {open && (
        <CloseRow.Provider
          value={() => {
            setOpen(false)
          }}
        >
          <div className="mt-4">{children}</div>
        </CloseRow.Provider>
      )}
    </div>
  )
}
