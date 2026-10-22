'use client'

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useIsClient } from '@/shared/hooks/use-is-client'

export function ClientPortal({ children }: { children: ReactNode }) {
  const client = useIsClient()
  return client ? createPortal(children, document.body) : null
}
