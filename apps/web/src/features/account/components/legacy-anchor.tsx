'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { legacyAnchorHref } from '../settings-sections'

export function LegacyAnchor() {
  const router = useRouter()

  useEffect(() => {
    const landed = legacyAnchorHref(window.location.hash)
    if (landed !== null) {
      router.replace(landed)
    }

    function followSamePageAnchor(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (link?.pathname !== window.location.pathname) {
        return
      }
      const href = legacyAnchorHref(link.hash)
      if (href !== null) {
        event.preventDefault()
        router.push(href)
      }
    }

    document.addEventListener('click', followSamePageAnchor, true)
    return () => {
      document.removeEventListener('click', followSamePageAnchor, true)
    }
  }, [router])

  return null
}
