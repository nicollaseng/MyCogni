'use client'

import { useEditorState, type Editor } from '@tiptap/react'
import { useTranslations } from 'next-intl'
import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon, type IconName } from '../components/icon'
import {
  canIndent,
  canOutdent,
  indent,
  listKinds,
  markNames,
  outdent,
  textStyleOf,
  toggleListKind,
  toggleMarkNamed,
  type ListKind,
  type MarkName,
  type TextStyle,
} from './commands'
import { dashListName } from './extensions'
import { TextStyleMenu, TextStyleOptions } from './text-styles'
import { ToolbarButton, ToolbarGroup } from './toolbar-button'
import { useKeyboardHeight, useWideScreen } from './viewport'

interface ToolbarState {
  style: TextStyle
  marks: Readonly<Record<MarkName, boolean>>
  lists: Readonly<Record<ListKind, boolean>>
  canIndent: boolean
  canOutdent: boolean
}

interface EditorToolbarProps {
  editor: Editor
  onPhotos: (files: File[]) => void
  photosDisabled: boolean
}

interface ControlsProps {
  editor: Editor
  state: ToolbarState
  className?: string
  stretch?: boolean
}

const markGlyphs: Readonly<Record<MarkName, ReactNode>> = {
  bold: <span className="text-[17px] font-bold">B</span>,
  italic: <span className="font-serif text-[20px] italic">I</span>,
  underline: <span className="text-[17px] underline underline-offset-[3px]">U</span>,
  strike: <span className="text-[17px] line-through">S</span>,
}

const listIcons: Readonly<Record<ListKind, IconName>> = {
  bulletList: 'bullets',
  dashList: 'dashes',
  orderedList: 'numbers',
  taskList: 'checklist',
}

const compactLists: readonly ListKind[] = ['bulletList', 'dashList', 'orderedList']

const segment = 'rounded-[6px] bg-background p-0.5'

function useToolbarState(editor: Editor): ToolbarState {
  return useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      style: textStyleOf(current),
      marks: {
        bold: current.isActive('bold'),
        italic: current.isActive('italic'),
        underline: current.isActive('underline'),
        strike: current.isActive('strike'),
      },
      lists: {
        bulletList: current.isActive('bulletList'),
        dashList: current.isActive(dashListName),
        orderedList: current.isActive('orderedList'),
        taskList: current.isActive('taskList'),
      },
      canIndent: canIndent(current),
      canOutdent: canOutdent(current),
    }),
  })
}

function MarkButtons({ editor, state, className, stretch = false }: ControlsProps) {
  const t = useTranslations('mybook.editor.toolbar')
  return (
    <ToolbarGroup className={className}>
      {markNames.map((mark) => (
        <ToolbarButton
          key={mark}
          label={t(mark)}
          pressed={state.marks[mark]}
          onPress={() => {
            toggleMarkNamed(editor, mark)
          }}
          className={cn(stretch && 'flex-1')}
        >
          {markGlyphs[mark]}
        </ToolbarButton>
      ))}
    </ToolbarGroup>
  )
}

function ListButtons({
  editor,
  state,
  kinds,
  className,
  stretch = false,
}: ControlsProps & { kinds: readonly ListKind[] }) {
  const t = useTranslations('mybook.editor.toolbar')
  return (
    <ToolbarGroup className={className}>
      {kinds.map((kind) => (
        <ToolbarButton
          key={kind}
          label={t(kind)}
          pressed={state.lists[kind]}
          onPress={() => {
            toggleListKind(editor, kind)
          }}
          className={cn(stretch && 'flex-1')}
        >
          <Icon name={listIcons[kind]} />
        </ToolbarButton>
      ))}
    </ToolbarGroup>
  )
}

function IndentButtons({ editor, state, className, stretch = false }: ControlsProps) {
  const t = useTranslations('mybook.editor.toolbar')
  return (
    <ToolbarGroup className={className}>
      <ToolbarButton
        label={t('outdent')}
        disabled={!state.canOutdent}
        onPress={() => {
          outdent(editor)
        }}
        className={cn(stretch && 'flex-1')}
      >
        <Icon name="outdent" />
      </ToolbarButton>
      <ToolbarButton
        label={t('indent')}
        disabled={!state.canIndent}
        onPress={() => {
          indent(editor)
        }}
        className={cn(stretch && 'flex-1')}
      >
        <Icon name="indent" />
      </ToolbarButton>
    </ToolbarGroup>
  )
}

function PhotoButton({ onPhotos, photosDisabled }: Omit<EditorToolbarProps, 'editor'>) {
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

function CompactToolbar({ editor, onPhotos, photosDisabled }: EditorToolbarProps) {
  const t = useTranslations('mybook.editor.toolbar')
  const state = useToolbarState(editor)
  const keyboard = useKeyboardHeight()
  const [formatting, setFormatting] = useState(false)

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 px-3 pb-2"
      style={keyboard > 0 ? { bottom: keyboard } : undefined}
    >
      <div className="mx-auto max-w-md space-y-2">
        {formatting && (
          <div
            role="group"
            aria-label={t('format')}
            className="space-y-2 rounded-[10px] bg-surface p-2 shadow-[0_0_0_1px_var(--rule),0_4px_14px_rgb(0_0_0/0.06)]"
          >
            <TextStyleOptions
              editor={editor}
              current={state.style}
              layout="row"
              onChosen={() => undefined}
            />
            <MarkButtons editor={editor} state={state} className={segment} stretch />
            <div className="flex gap-2">
              <ListButtons
                editor={editor}
                state={state}
                kinds={compactLists}
                className={cn(segment, 'flex-[3]')}
                stretch
              />
              <IndentButtons
                editor={editor}
                state={state}
                className={cn(segment, 'flex-[2]')}
                stretch
              />
            </div>
          </div>
        )}
        <div
          role="toolbar"
          aria-label={t('label')}
          className="flex items-center justify-around rounded-[10px] bg-surface px-3 py-1 shadow-[0_0_0_1px_var(--rule),0_4px_14px_rgb(0_0_0/0.06)]"
        >
          <ToolbarButton
            label={t('format')}
            expanded={formatting}
            onPress={() => {
              setFormatting((value) => !value)
            }}
          >
            <span aria-hidden className="font-serif text-[19px] leading-none">
              Aa
            </span>
          </ToolbarButton>
          <ListButtons editor={editor} state={state} kinds={['taskList']} />
          <PhotoButton onPhotos={onPhotos} photosDisabled={photosDisabled} />
        </div>
      </div>
    </div>
  )
}

export function EditorToolbar(props: EditorToolbarProps) {
  return useWideScreen() ? <WideToolbar {...props} /> : <CompactToolbar {...props} />
}
