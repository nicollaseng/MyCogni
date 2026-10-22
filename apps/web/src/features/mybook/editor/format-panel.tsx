'use client'

import type { Editor } from '@tiptap/react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, type RefObject } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from '../components/icon'
import type { ListKind } from './commands'
import { IndentButtons, ListButtons, MarkButtons, useToolbarState } from './format-controls'
import { TextStyleOptions } from './text-styles'
import type { WritingChrome } from './use-writing-chrome'

interface FormatPanelProps {
  editor: Editor
  chrome: WritingChrome
  surface: RefObject<HTMLDivElement | null>
}

const segment = 'rounded-[6px] bg-background p-0.5'

const panelLists: readonly ListKind[] = ['bulletList', 'dashList', 'orderedList']

export function FormatPanel({ editor, chrome, surface }: FormatPanelProps) {
  const t = useTranslations('mybook.editor.toolbar')
  const state = useToolbarState(editor)
  const title = useId()
  const { closeFormatting } = chrome

  useEffect(() => {
    surface.current?.focus({ preventScroll: true })
  }, [surface])

  return (
    <div
      ref={surface}
      role="group"
      aria-labelledby={title}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          closeFormatting()
        }
      }}
      style={{ minHeight: chrome.panel }}
      className="fixed inset-x-0 bottom-0 z-20 m-0 rounded-t-[8px] bg-surface px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--rule)] outline-none"
    >
      <div className="mx-auto max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 id={title} className="text-[17px] font-semibold">
            {t('panelTitle')}
          </h2>
          <button
            type="button"
            aria-label={t('closePanel')}
            onClick={closeFormatting}
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-150 hover:bg-sage hover:text-foreground motion-reduce:transition-none"
          >
            <Icon name="close" />
          </button>
        </div>
        <TextStyleOptions
          editor={editor}
          current={state.style}
          layout="row"
          refocus={false}
          onChosen={() => undefined}
        />
        <MarkButtons editor={editor} state={state} className={segment} stretch refocus={false} />
        <div className="flex gap-2">
          <ListButtons
            editor={editor}
            state={state}
            kinds={panelLists}
            className={cn(segment, 'flex-[3]')}
            stretch
            refocus={false}
          />
          <IndentButtons
            editor={editor}
            state={state}
            className={cn(segment, 'flex-[2]')}
            stretch
            refocus={false}
          />
        </div>
      </div>
    </div>
  )
}
