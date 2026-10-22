'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function ToastRegion({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 sm:bottom-6"
    >
      {children}
    </div>
  )
}

interface UndoToastProps {
  message: string
  undoLabel: string
  duration: number
  onUndo: () => void
  onExpire: () => void
}

export function UndoToast({ message, undoLabel, duration, onUndo, onExpire }: UndoToastProps) {
  const [held, setHeld] = useState(false)
  const expire = useRef(onExpire)

  useEffect(() => {
    expire.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (held) {
      return undefined
    }
    const timer = setTimeout(() => {
      expire.current()
    }, duration)
    return () => {
      clearTimeout(timer)
    }
  }, [held, duration])

  return (
    <div
      onFocus={() => {
        setHeld(true)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHeld(false)
        }
      }}
      className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-4 rounded-lg bg-background py-1.5 pr-1.5 pl-4 shadow-[0_0_0_1px_var(--rule),0_6px_18px_rgb(0_0_0/0.1)] transition-[opacity,translate] duration-200 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none"
    >
      <p className="text-[15px]">{message}</p>
      <button
        type="button"
        onClick={onUndo}
        className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-md px-3 text-[15px] font-medium text-emphasis transition-colors duration-150 hover:bg-foreground/[0.06] motion-reduce:transition-none"
      >
        {undoLabel}
      </button>
    </div>
  )
}
