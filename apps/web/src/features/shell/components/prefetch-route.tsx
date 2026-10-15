'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function PrefetchRoute({ href }: { href: Route }) {
  const router = useRouter()
  useEffect(() => {
    router.prefetch(href)
  }, [router, href])
  return null
}
