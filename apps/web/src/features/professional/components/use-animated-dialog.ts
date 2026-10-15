'use client'

import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

export const dialogMotion = 240

export const drawerMotion =
  'transition-[translate] duration-[240ms] ease-out backdrop:bg-black/30 backdrop:transition-[background-color] backdrop:duration-[240ms] starting:backdrop:bg-black/0 data-closing:ease-in data-closing:backdrop:bg-black/0 motion-reduce:transition-none motion-reduce:backdrop:transition-none'

interface AnimatedDialogOptions {
  initiallyOpen?: boolean
  onOpen?: () => void
}

export function useAnimatedDialog({ initiallyOpen = false, onOpen }: AnimatedDialogOptions = {}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [closing, setClosing] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
      }
    },
    [],
  )

  useEffect(() => {
    const element = dialog.current
    if (initiallyOpen && element !== null && !element.open) {
      element.showModal()
    }
  }, [initiallyOpen])

  function open() {
    const element = dialog.current
    if (element === null || element.open) {
      return
    }
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    setClosing(false)
    element.showModal()
    onOpen?.()
  }

  function close() {
    const element = dialog.current
    if (element === null || !element.open || timer.current !== null) {
      return
    }
    if (reduced) {
      element.close()
      return
    }
    setClosing(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setClosing(false)
      element.close()
    }, dialogMotion)
  }

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    close()
  }

  return { dialog, open, close, closing, onCancel }
}

export function usePresence(
  open: boolean,
  duration: number,
): {
  mounted: boolean
  closing: boolean
} {
  const reduced = usePrefersReducedMotion()
  const [lingering, setLingering] = useState(false)
  const [previous, setPrevious] = useState(open)

  if (previous !== open) {
    setPrevious(open)
    setLingering(!open)
  }

  useEffect(() => {
    if (!lingering) {
      return
    }
    const timer = setTimeout(
      () => {
        setLingering(false)
      },
      reduced ? 0 : duration,
    )
    return () => {
      clearTimeout(timer)
    }
  }, [lingering, reduced, duration])

  return { mounted: open || lingering, closing: lingering && !open }
}
