'use client'

import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { cn } from '@/shared/lib/utils'
import { menuSurface } from '@/shared/ui/menu'

interface PopoverPanelProps {
  id: string
  title: string
  trigger: RefObject<HTMLElement | null>
  onClose: (returnFocus: boolean) => void
  className?: string
  children: ReactNode
}

export function PopoverPanel({
  id,
  title,
  trigger,
  onClose,
  className,
  children,
}: PopoverPanelProps) {
  const panel = useRef<HTMLDivElement>(null)
  const latestClose = useRef(onClose)

  useEffect(() => {
    latestClose.current = onClose
  }, [onClose])

  useEffect(() => {
    panel.current?.focus()
    function onPointer(event: PointerEvent) {
      const target = event.target
      if (
        target instanceof Node &&
        !panel.current?.contains(target) &&
        !trigger.current?.contains(target)
      ) {
        latestClose.current(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [trigger])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose(true)
    }
  }

  return (
    <div
      ref={panel}
      id={id}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cn(
        menuSurface,
        'absolute top-full right-0 mt-2 flex origin-top-right flex-col starting:-translate-y-1 starting:scale-[0.98] starting:opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
