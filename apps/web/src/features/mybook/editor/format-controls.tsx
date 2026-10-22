'use client'

import { useEditorState, type Editor } from '@tiptap/react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon, type IconName } from '../components/icon'
import {
  canIndent,
  canOutdent,
  indent,
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
import { ToolbarButton, ToolbarGroup } from './toolbar-button'

export interface ToolbarState {
  style: TextStyle
  marks: Readonly<Record<MarkName, boolean>>
  lists: Readonly<Record<ListKind, boolean>>
  canIndent: boolean
  canOutdent: boolean
}

export interface ControlsProps {
  editor: Editor
  state: ToolbarState
  className?: string
  stretch?: boolean
  refocus?: boolean
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

export function useToolbarState(editor: Editor): ToolbarState {
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

export function MarkButtons({
  editor,
  state,
  className,
  stretch = false,
  refocus = true,
}: ControlsProps) {
  const t = useTranslations('mybook.editor.toolbar')
  return (
    <ToolbarGroup className={className}>
      {markNames.map((mark) => (
        <ToolbarButton
          key={mark}
          label={t(mark)}
          pressed={state.marks[mark]}
          onPress={() => {
            toggleMarkNamed(editor, mark, refocus)
          }}
          className={cn(stretch && 'flex-1')}
        >
          {markGlyphs[mark]}
        </ToolbarButton>
      ))}
    </ToolbarGroup>
  )
}

export function ListButtons({
  editor,
  state,
  kinds,
  className,
  stretch = false,
  refocus = true,
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
            toggleListKind(editor, kind, refocus)
          }}
          className={cn(stretch && 'flex-1')}
        >
          <Icon name={listIcons[kind]} />
        </ToolbarButton>
      ))}
    </ToolbarGroup>
  )
}

export function IndentButtons({
  editor,
  state,
  className,
  stretch = false,
  refocus = true,
}: ControlsProps) {
  const t = useTranslations('mybook.editor.toolbar')
  return (
    <ToolbarGroup className={className}>
      <ToolbarButton
        label={t('outdent')}
        disabled={!state.canOutdent}
        onPress={() => {
          outdent(editor, refocus)
        }}
        className={cn(stretch && 'flex-1')}
      >
        <Icon name="outdent" />
      </ToolbarButton>
      <ToolbarButton
        label={t('indent')}
        disabled={!state.canIndent}
        onPress={() => {
          indent(editor, refocus)
        }}
        className={cn(stretch && 'flex-1')}
      >
        <Icon name="indent" />
      </ToolbarButton>
    </ToolbarGroup>
  )
}
