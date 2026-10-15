'use client'

import type { Editor } from '@tiptap/react'
import { useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from '../components/icon'
import { useDismiss } from '../components/use-dismiss'
import { applyTextStyle, textStyles, type TextStyle } from './commands'
import { keepEditorFocus } from './toolbar-button'

const styleLooks: Readonly<Record<TextStyle, string>> = {
  title: 'font-serif text-[19px] leading-tight font-medium',
  heading: 'font-serif text-[16px] leading-tight font-medium',
  subheading: 'text-[14px] font-semibold',
  body: 'text-[14px]',
}

interface TextStyleOptionsProps {
  editor: Editor
  current: TextStyle
  layout: 'row' | 'column'
  onChosen: () => void
}

export function TextStyleOptions({ editor, current, layout, onChosen }: TextStyleOptionsProps) {
  const t = useTranslations('mybook.editor.toolbar')

  return (
    <div
      role="group"
      aria-label={t('styles')}
      className={cn(
        layout === 'row'
          ? 'flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'flex flex-col gap-0.5',
      )}
    >
      {textStyles.map((style) => (
        <button
          key={style}
          type="button"
          aria-pressed={current === style}
          onMouseDown={keepEditorFocus}
          onClick={() => {
            applyTextStyle(editor, style)
            onChosen()
          }}
          className={cn(
            'shrink-0 rounded-[6px] px-2.5 py-2 text-left whitespace-nowrap transition-colors duration-150 hover:bg-sage aria-pressed:bg-primary aria-pressed:text-primary-foreground motion-reduce:transition-none',
            styleLooks[style],
          )}
        >
          {t(style)}
        </button>
      ))}
    </div>
  )
}

export function TextStyleMenu({ editor, current }: { editor: Editor; current: TextStyle }) {
  const t = useTranslations('mybook.editor.toolbar')
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const close = useCallback(() => {
    setOpen(false)
  }, [])
  useDismiss(container, open, close)

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${t('styles')}: ${t(current)}`}
        onMouseDown={keepEditorFocus}
        onClick={() => {
          setOpen((value) => !value)
        }}
        className="inline-flex h-10 items-center gap-2 rounded-[6px] pr-2 pl-3 text-[15px] transition-colors duration-150 hover:bg-sage aria-expanded:bg-sage motion-reduce:transition-none"
      >
        <span aria-hidden className="font-serif text-[18px] leading-none">
          Aa
        </span>
        <span className="min-w-[5.75rem] text-left">{t(current)}</span>
        <Icon name="chevron" className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1.5 w-56 rounded-[8px] bg-background p-1.5 shadow-[0_4px_14px_rgb(0_0_0/0.08)] ring-1 ring-rule">
          <TextStyleOptions editor={editor} current={current} layout="column" onChosen={close} />
        </div>
      )}
    </div>
  )
}
