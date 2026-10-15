import { useSyncExternalStore } from 'react'

const wideQuery = '(min-width: 40rem)'

const keyboardThreshold = 120

function subscribeToWidth(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') {
    return () => undefined
  }
  const media = window.matchMedia(wideQuery)
  media.addEventListener('change', onChange)
  return () => {
    media.removeEventListener('change', onChange)
  }
}

function isWide(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(wideQuery).matches
}

function subscribeToViewport(onChange: () => void): () => void {
  const viewport = window.visualViewport
  if (!viewport) {
    return () => undefined
  }
  viewport.addEventListener('resize', onChange)
  viewport.addEventListener('scroll', onChange)
  return () => {
    viewport.removeEventListener('resize', onChange)
    viewport.removeEventListener('scroll', onChange)
  }
}

function keyboardHeight(): number {
  const viewport = window.visualViewport
  if (!viewport) {
    return 0
  }
  const covered = Math.round(window.innerHeight - viewport.height - viewport.offsetTop)
  return covered > keyboardThreshold ? covered : 0
}

export function useWideScreen(): boolean {
  return useSyncExternalStore(subscribeToWidth, isWide, () => false)
}

export function useKeyboardHeight(): number {
  return useSyncExternalStore(subscribeToViewport, keyboardHeight, () => 0)
}
