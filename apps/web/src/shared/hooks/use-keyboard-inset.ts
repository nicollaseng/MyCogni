import { useSyncExternalStore } from 'react'

export const smallestKeyboard = 120

type ViewportBox = Pick<VisualViewport, 'height' | 'offsetTop'>

export function keyboardInset(
  layoutHeight: number,
  viewport: ViewportBox | null | undefined,
): number {
  if (!viewport) {
    return 0
  }
  const covered = Math.round(layoutHeight - (viewport.height + viewport.offsetTop))
  return covered >= smallestKeyboard ? covered : 0
}

function subscribe(onChange: () => void): () => void {
  const viewport = window.visualViewport
  viewport?.addEventListener('resize', onChange)
  viewport?.addEventListener('scroll', onChange)
  window.addEventListener('resize', onChange)
  return () => {
    viewport?.removeEventListener('resize', onChange)
    viewport?.removeEventListener('scroll', onChange)
    window.removeEventListener('resize', onChange)
  }
}

function currentInset(): number {
  return keyboardInset(window.innerHeight, window.visualViewport)
}

export function useKeyboardInset(): number {
  return useSyncExternalStore(subscribe, currentInset, () => 0)
}
