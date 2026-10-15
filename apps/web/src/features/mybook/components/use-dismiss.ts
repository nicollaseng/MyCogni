import { useEffect, type RefObject } from 'react'

export function useDismiss(
  container: RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
): void {
  useEffect(() => {
    if (!open) {
      return
    }
    function onPointer(event: PointerEvent) {
      if (event.target instanceof Node && container.current?.contains(event.target) !== true) {
        close()
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [container, open, close])
}
