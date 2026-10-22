'use client'

import type { Editor } from '@tiptap/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react'
import { useHiddenTabBar } from '@/shared/hooks/use-hidden-tab-bar'
import { useKeyboardInset } from '@/shared/hooks/use-keyboard-inset'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { useCaretReveal } from './caret-reveal'

export type ChromeMode = 'reading' | 'writing' | 'formatting'

type Formatting = 'closed' | 'open' | 'closing'

export interface ChromePlacement {
  mode: ChromeMode
  keyboard: number
  panel: number
}

export interface WritingChrome extends ChromePlacement {
  openFormatting: () => void
  closeFormatting: () => void
}

export const barHeight = 48

export const fallbackPanel = 300

const tabBarHeight = 56

const breathing = 24

const keyboardWait = 600

export function bottomSpace({ mode, keyboard, panel }: ChromePlacement): number {
  switch (mode) {
    case 'writing':
      return barHeight + keyboard + breathing
    case 'formatting':
      return panel + breathing
    case 'reading':
      return barHeight + tabBarHeight + breathing
  }
}

const textFields = 'textarea, input[type="text"], [contenteditable="true"]'

function modeOf(panelShown: boolean, keyboard: number): ChromeMode {
  if (panelShown) {
    return 'formatting'
  }
  return keyboard > 0 ? 'writing' : 'reading'
}

function subscribeToFocus(onChange: () => void): () => void {
  document.addEventListener('focusin', onChange)
  document.addEventListener('focusout', onChange)
  return () => {
    document.removeEventListener('focusin', onChange)
    document.removeEventListener('focusout', onChange)
  }
}

function useTextFocus(page: RefObject<HTMLElement | null>): boolean {
  const focused = useCallback(() => {
    const active = document.activeElement
    return active?.matches(textFields) === true && page.current?.contains(active) === true
  }, [page])
  return useSyncExternalStore(subscribeToFocus, focused, () => false)
}

export function useWritingChrome(
  editor: Editor | null,
  page: RefObject<HTMLElement | null>,
  surface: RefObject<HTMLElement | null>,
  compact: boolean,
): WritingChrome {
  const inset = useKeyboardInset()
  const typing = useTextFocus(page)
  const touch = useMediaQuery('(pointer: coarse)')
  const [formatting, setFormatting] = useState<Formatting>('closed')
  const [panel, setPanel] = useState(fallbackPanel)
  const lastKeyboard = useRef(0)
  const keyboard = compact && typing ? inset : 0
  const panelShown = formatting === 'open' || (formatting === 'closing' && keyboard === 0)
  const mode = compact ? modeOf(panelShown, keyboard) : 'reading'
  const settled = touch ? 'closing' : 'closed'

  useHiddenTabBar(mode !== 'reading')
  useCaretReveal(
    editor,
    surface,
    mode === 'formatting',
    `${mode}:${String(keyboard)}:${String(panel)}`,
  )

  useEffect(() => {
    if (keyboard > 0) {
      lastKeyboard.current = keyboard
    }
  }, [keyboard])

  useEffect(() => {
    if (formatting !== 'closing') {
      return
    }
    const timer = window.setTimeout(() => {
      setFormatting('closed')
    }, keyboardWait)
    return () => {
      window.clearTimeout(timer)
    }
  }, [formatting])

  useEffect(() => {
    const root = page.current
    if (root === null) {
      return
    }
    const resume = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(textFields)) {
        setFormatting((current) => (current === 'open' ? settled : current))
      }
    }
    root.addEventListener('focusin', resume)
    return () => {
      root.removeEventListener('focusin', resume)
    }
  }, [page, settled])

  function openFormatting() {
    const remembered = keyboard > 0 ? keyboard : lastKeyboard.current
    setPanel(remembered > 0 ? remembered : fallbackPanel)
    const active = document.activeElement
    if (active instanceof HTMLElement && page.current?.contains(active) === true) {
      active.blur()
      window.getSelection()?.removeAllRanges()
    }
    setFormatting('open')
  }

  function closeFormatting() {
    setFormatting(settled)
    editor?.view.focus()
  }

  return { mode, keyboard, panel, openFormatting, closeFormatting }
}
