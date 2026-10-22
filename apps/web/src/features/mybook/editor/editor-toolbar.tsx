'use client'

import type { Editor } from '@tiptap/react'
import { useTranslations } from 'next-intl'
import { useRef, type RefObject } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from '../components/icon'
import { listKinds } from './commands'
import { IndentButtons, ListButtons, MarkButtons, useToolbarState } from './format-controls'
import { FormatPanel } from './format-panel'
import { TextStyleMenu } from './text-styles'
import { ToolbarButton } from './toolbar-button'
import { barHeight, type WritingChrome } from './use-writing-chrome'

interface PhotoProps {
  onPhotos: (files: File[]) => void
  photosDisabled: boolean
}

interface EditorToolbarProps extends PhotoProps {
  editor: Editor
  chrome: WritingChrome
  surface: RefObject<HTMLDivElement | null>
  wide: boolean
}

function PhotoButton({ onPhotos, photosDisabled }: PhotoProps) {
  const t = useTranslations('mybook.editor.toolbar')
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <ToolbarButton
        label={t('photo')}
        disabled={photosDisabled}
        onPress={() => {
          input.current?.click()
        }}
      >
        <Icon name="photo" />
      </ToolbarButton>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          event.currentTarget.value = ''
          if (files.length > 0) {
            onPhotos(files)
          }
        }}
      />
    </>
  )
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-rule" />
}

function WideToolbar({ editor, onPhotos, photosDisabled }: EditorToolbarProps) {
  const t = useTranslations('mybook.editor.toolbar')
  const state = useToolbarState(editor)
  return (
    <div
      role="toolbar"
      aria-label={t('label')}
      className="sticky top-3 z-20 -mx-3 flex flex-wrap items-center gap-y-1 rounded-[8px] bg-surface px-1.5 py-1.5"
    >
      <TextStyleMenu editor={editor} current={state.style} />
      <Divider />
      <MarkButtons editor={editor} state={state} />
      <Divider />
      <ListButtons editor={editor} state={state} kinds={listKinds} />
      <Divider />
      <IndentButtons editor={editor} state={state} />
      <Divider />
      <PhotoButton onPhotos={onPhotos} photosDisabled={photosDisabled} />
    </div>
  )
}

function FormatBar({ editor, chrome, surface, onPhotos, photosDisabled }: EditorToolbarProps) {
  const t = useTranslations('mybook.editor.toolbar')
  const state = useToolbarState(editor)
  const writing = chrome.mode === 'writing'
  return (
    <div
      ref={surface}
      role="toolbar"
      aria-label={t('label')}
      data-placement={chrome.mode}
      style={writing ? { height: barHeight, bottom: chrome.keyboard } : { height: barHeight }}
      className={cn(
        'fixed inset-x-0 m-0 flex justify-center bg-surface px-3',
        writing
          ? 'z-20'
          : 'bottom-[calc(var(--spacing-tab-bar)+env(safe-area-inset-bottom))] z-[5]',
      )}
    >
      <div className="flex w-full max-w-md items-center justify-around">
        <ToolbarButton label={t('format')} onPress={chrome.openFormatting}>
          <span aria-hidden className="font-serif text-[19px] leading-none">
            Aa
          </span>
        </ToolbarButton>
        <ListButtons editor={editor} state={state} kinds={['taskList']} />
        <PhotoButton onPhotos={onPhotos} photosDisabled={photosDisabled} />
      </div>
    </div>
  )
}

export function EditorToolbar(props: EditorToolbarProps) {
  if (props.wide) {
    return <WideToolbar {...props} />
  }
  return props.chrome.mode === 'formatting' ? (
    <FormatPanel editor={props.editor} chrome={props.chrome} surface={props.surface} />
  ) : (
    <FormatBar {...props} />
  )
}
