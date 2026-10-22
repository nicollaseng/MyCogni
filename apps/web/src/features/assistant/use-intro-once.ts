'use client'

import { useEffect, useState } from 'react'

const introKey = 'mycogni.cogni-intro'

function seen(): boolean {
  try {
    return window.localStorage.getItem(introKey) === 'seen'
  } catch {
    return false
  }
}

function remember(): void {
  try {
    window.localStorage.setItem(introKey, 'seen')
  } catch {
    return
  }
}

export function useIntroOnce(enabled: boolean): boolean {
  const [show] = useState(() => enabled && !seen())

  useEffect(() => {
    if (show) {
      remember()
    }
  }, [show])

  return show
}
