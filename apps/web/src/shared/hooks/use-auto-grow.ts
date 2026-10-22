import { useLayoutEffect, useRef, type RefObject } from 'react'

export function useAutoGrow(value: string): RefObject<HTMLTextAreaElement | null> {
  const field = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const element = field.current
    if (element === null) {
      return
    }
    element.style.height = 'auto'
    element.style.height = `${String(element.scrollHeight)}px`
  }, [value])

  return field
}
