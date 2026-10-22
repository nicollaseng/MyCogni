import { useSyncExternalStore } from 'react'

function subscribeToNothing(): () => void {
  return () => undefined
}

export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
}
