'use client'

import type { Editor } from '@tiptap/react'
import { useEffect } from 'react'

const prefix = '#photo='

const attempts = 30

export function photoHash(path: string): string {
  return `${prefix}${encodeURIComponent(path)}`
}

export function photoFromHash(hash: string): string | null {
  if (!hash.startsWith(prefix)) {
    return null
  }
  try {
    return decodeURIComponent(hash.slice(prefix.length))
  } catch {
    return null
  }
}

export function useRevealPhotoFromHash(editor: Editor | null): void {
  useEffect(() => {
    const path = photoFromHash(window.location.hash)
    if (editor === null || path === null) {
      return
    }
    let frame = 0
    let tries = 0
    const reveal = () => {
      const tile = document.querySelector<HTMLElement>(`[data-photo-tile="${CSS.escape(path)}"]`)
      if (tile !== null) {
        tile.scrollIntoView({ block: 'center', inline: 'center' })
        tile.focus({ preventScroll: true })
        return
      }
      tries += 1
      if (tries < attempts) {
        frame = window.requestAnimationFrame(reveal)
      }
    }
    frame = window.requestAnimationFrame(reveal)
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [editor])
}
