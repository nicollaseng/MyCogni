'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/shared/lib/utils'

export const disclosureDuration = 220

interface DisclosurePanelProps {
  id: string
  open: boolean
  children: ReactNode
  className?: string
  keepMounted?: boolean
}

export function DisclosurePanel({
  id,
  open,
  children,
  className,
  keepMounted = false,
}: DisclosurePanelProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) {
    setMounted(true)
  }

  useEffect(() => {
    if (open) {
      return undefined
    }
    const timer = window.setTimeout(
      () => {
        setMounted(false)
      },
      reducedMotion ? 0 : disclosureDuration,
    )
    return () => {
      window.clearTimeout(timer)
    }
  }, [open, reducedMotion])

  return (
    <div
      id={id}
      inert={!open}
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'grid transition-[grid-template-rows,opacity] ease-out motion-reduce:transition-none',
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}
      style={{ transitionDuration: `${String(disclosureDuration)}ms` }}
    >
      <div className="min-h-0 overflow-hidden">
        {(open || mounted || keepMounted) && <div className={className}>{children}</div>}
      </div>
    </div>
  )
}

export function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn(
        'size-4 shrink-0 transition-transform ease-out motion-reduce:transition-none',
        open && 'rotate-180',
        className,
      )}
      style={{ transitionDuration: `${String(disclosureDuration)}ms` }}
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface DisclosureProps {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  buttonClassName?: string
  panelClassName?: string
  keepMounted?: boolean
}

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className,
  buttonClassName,
  panelClassName,
  keepMounted = false,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open)
        }}
        className={cn('flex cursor-pointer items-center gap-2 text-left', buttonClassName)}
      >
        {summary}
        <Chevron open={open} />
      </button>
      <DisclosurePanel
        id={panelId}
        open={open}
        className={panelClassName}
        keepMounted={keepMounted}
      >
        {children}
      </DisclosurePanel>
    </div>
  )
}
