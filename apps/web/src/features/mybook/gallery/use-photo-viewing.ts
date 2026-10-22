'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GalleryActions } from './gallery-context'

export interface PhotoViewing {
  viewing: string | null
  actions: GalleryActions
  close: (last: string | null) => void
}

function focusTile(path: string): void {
  document.querySelector<HTMLElement>(`[data-photo-tile="${CSS.escape(path)}"]`)?.focus()
}

export function usePhotoViewing(): PhotoViewing {
  const [viewing, setViewing] = useState<string | null>(null)
  const returnTo = useRef<string | null>(null)
  const actions = useMemo(() => ({ open: setViewing }), [])

  useEffect(() => {
    const path = returnTo.current
    if (viewing === null && path !== null) {
      returnTo.current = null
      focusTile(path)
    }
  }, [viewing])

  return {
    viewing,
    actions,
    close: (last) => {
      returnTo.current = last ?? viewing
      setViewing(null)
    },
  }
}
