import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

function supportsMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

function subscribe(onChange: () => void): () => void {
  if (!supportsMatchMedia()) {
    return () => undefined
  }
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => {
    media.removeEventListener('change', onChange)
  }
}

function snapshot(): boolean {
  return supportsMatchMedia() && window.matchMedia(query).matches
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
