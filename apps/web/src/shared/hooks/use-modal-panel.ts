'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion'

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ModalPanel<T extends HTMLElement> {
  panel: RefObject<T | null>
  closing: boolean
  close: () => void
  onKeyDown: (event: KeyboardEvent<T>) => void
}

export function useModalPanel<T extends HTMLElement>(
  onClose: () => void,
  duration: number,
): ModalPanel<T> {
  const panel = useRef<T>(null)
  const reducedMotion = usePrefersReducedMotion()
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
      reducedMotion ? 0 : duration,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [closing, reducedMotion, duration])

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

  function onKeyDown(event: KeyboardEvent<T>) {
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

  return { panel, closing, close, onKeyDown }
}
