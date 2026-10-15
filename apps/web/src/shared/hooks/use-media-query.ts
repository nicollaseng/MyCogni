import { useCallback, useSyncExternalStore } from 'react'

function supportsMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!supportsMatchMedia()) {
        return () => undefined
      }
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => {
        media.removeEventListener('change', onChange)
      }
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => supportsMatchMedia() && window.matchMedia(query).matches,
    () => false,
  )
}
