'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

function subscribeToNothing(): () => void {
  return () => undefined
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
}

export function ClientPortal({ children }: { children: ReactNode }) {
  const client = useIsClient()
  return client ? createPortal(children, document.body) : null
}
