'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { usePresence } from './use-animated-dialog'

const popoverMotion = 150

function menuItems(element: HTMLElement | null): HTMLElement[] {
  return Array.from(element?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []).filter(
    (item) => item.closest('[inert]') === null,
  )
}

export function usePopoverMenu(external?: RefObject<HTMLButtonElement | null>) {
  const [open, setOpen] = useState(false)
  const own = useRef<HTMLButtonElement>(null)
  const trigger = external ?? own
  const panel = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const pathname = usePathname()
  const [openedOn, setOpenedOn] = useState(pathname)
  const { mounted, closing } = usePresence(open, popoverMotion)

  if (openedOn !== pathname) {
    setOpenedOn(pathname)
    setOpen(false)
  }

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) {
      trigger.current?.focus()
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }
    const first = menuItems(panel.current)[0] ?? panel.current
    first?.focus()
    function onPointer(event: PointerEvent) {
      const target = event.target
      if (
        target instanceof Node &&
        !panel.current?.contains(target) &&
        !trigger.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, trigger])

  function onPanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    const list = menuItems(panel.current)
    const index = list.findIndex((item) => item === document.activeElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
    } else if (event.key === 'Tab') {
      setOpen(false)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const from = index === -1 && step === -1 ? 0 : index
      list[(from + step + list.length) % list.length]?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      list[event.key === 'Home' ? 0 : list.length - 1]?.focus()
    }
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
    }
  }

  return {
    open,
    mounted,
    closing,
    close,
    triggerProps: {
      ref: trigger,
      type: 'button' as const,
      'aria-haspopup': 'menu' as const,
      'aria-expanded': open,
      'aria-controls': open ? panelId : undefined,
      onClick: () => {
        setOpen((value) => !value)
      },
      onKeyDown: onTriggerKeyDown,
    },
    panelProps: { ref: panel, id: panelId, tabIndex: -1, onKeyDown: onPanelKeyDown },
  }
}
