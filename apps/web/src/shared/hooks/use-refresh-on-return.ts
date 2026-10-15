'use client'

import { useEffect, useRef } from 'react'

export const staleAfterMs = 60_000

export function useRefreshOnReturn(refresh: () => void, page: string): void {
  const freshAt = useRef(0)

  useEffect(() => {
    freshAt.current = Date.now()
  }, [page])

  useEffect(() => {
    function refreshIfStale() {
      if (document.visibilityState !== 'visible' || Date.now() - freshAt.current < staleAfterMs) {
        return
      }
      freshAt.current = Date.now()
      refresh()
    }
    document.addEventListener('visibilitychange', refreshIfStale)
    window.addEventListener('focus', refreshIfStale)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale)
      window.removeEventListener('focus', refreshIfStale)
    }
  }, [refresh])
}
