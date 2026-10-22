import type { Transaction } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/react'
import { useEffect, type RefObject } from 'react'

export const caretMargin = 16

interface LineBox {
  top: number
  bottom: number
}

export function caretShift(caret: LineBox, visibleTop: number, coveredFrom: number): number {
  const lowest = coveredFrom - caretMargin
  if (caret.bottom > lowest) {
    return caret.bottom - lowest
  }
  const highest = visibleTop + caretMargin
  return caret.top < highest ? caret.top - highest : 0
}

export function useCaretReveal(
  editor: Editor | null,
  surface: RefObject<HTMLElement | null>,
  formatting: boolean,
  placement: string,
): void {
  useEffect(() => {
    if (editor === null) {
      return
    }
    const reveal = () => {
      const covering = surface.current
      if (covering === null || (!formatting && !editor.view.hasFocus())) {
        return
      }
      const { view } = editor
      const shift = caretShift(
        view.coordsAtPos(view.state.selection.head),
        window.visualViewport?.offsetTop ?? 0,
        covering.getBoundingClientRect().top,
      )
      if (shift !== 0) {
        window.scrollBy({ top: shift, behavior: 'instant' })
      }
    }
    const follow = ({ transaction }: { transaction: Transaction }) => {
      if (transaction.docChanged || transaction.selectionSet) {
        reveal()
      }
    }
    reveal()
    editor.on('transaction', follow)
    return () => {
      editor.off('transaction', follow)
    }
  }, [editor, surface, formatting, placement])
}
