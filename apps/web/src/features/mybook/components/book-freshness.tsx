'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const opened = { page: false }

export function MarkPageOpened() {
  useEffect(() => {
    opened.page = true
  }, [])
  return null
}

export function RefreshAfterPageVisit() {
  const router = useRouter()
  useEffect(() => {
    if (opened.page) {
      opened.page = false
      router.refresh()
    }
  }, [router])
  return null
}
