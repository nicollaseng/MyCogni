'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useRefreshOnReturn } from '@/shared/hooks/use-refresh-on-return'

export function FreshOnReturn() {
  const router = useRouter()
  const refresh = useCallback(() => {
    router.refresh()
  }, [router])
  useRefreshOnReturn(refresh, usePathname())
  return null
}
