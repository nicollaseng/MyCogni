'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/shared/lib/utils'

export const sheetDuration = 240

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface SheetProps {
  title: string
  closeLabel: string
  onClose: () => void
  children: (close: () => void) => ReactNode
}

function subscribeToNothing(): () => void {
  return () => undefined
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
}

function SheetPanel({ title, closeLabel, onClose, children }: SheetProps) {
  const titleId = useId()
  const reducedMotion = usePrefersReducedMotion()
  const panel = useRef<HTMLDivElement>(null)
  const latestClose = useRef(onClose)
  const [closing, setClosing] = useState(false)

  const close = useCallback(() => {
    setClosing(true)
  }, [])

  useEffect(() => {
    latestClose.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!closing) {
      return
    }
    const timer = setTimeout(
      () => {
        latestClose.current()
      },
      reducedMotion ? 0 : sheetDuration,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [closing, reducedMotion])

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [])

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== 'Tab' || panel.current === null) {
      return
    }
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(focusable))
    const first = items[0]
    const last = items.at(-1)
    if (first === undefined || last === undefined) {
      return
    }
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === panel.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={close}
        className={cn(
          'absolute inset-0 bg-foreground/20 transition-opacity duration-[240ms] ease-out starting:opacity-0 motion-reduce:transition-none dark:bg-black/55',
          closing && 'opacity-0',
        )}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className={cn(
          'absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[8px] bg-background shadow-[0_-1px_0_var(--rule),0_-4px_16px_rgb(0_0_0/0.06)] outline-none transition-[translate] duration-[240ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] starting:translate-y-full motion-reduce:transition-none sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(27.5rem,100%)] sm:rounded-none sm:shadow-[-1px_0_0_var(--rule),-4px_0_16px_rgb(0_0_0/0.05)] sm:starting:translate-x-full sm:starting:translate-y-0',
          closing && 'translate-y-full sm:translate-x-full sm:translate-y-0',
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6 sm:pt-7">
          <h2 id={titleId} className="font-serif text-[23px] leading-tight tracking-[-0.01em]">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="-mt-1 -mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <span aria-hidden className="text-[26px] leading-none font-light">
              ×
            </span>
          </button>
        </div>
        {children(close)}
      </div>
    </div>
  )
}

export function Sheet(props: SheetProps) {
  const client = useIsClient()
  return client ? createPortal(<SheetPanel {...props} />, document.body) : null
}
