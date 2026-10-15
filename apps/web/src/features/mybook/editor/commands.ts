import type { Editor } from '@tiptap/react'
import { dashListName } from './extensions'

export const textStyles = ['title', 'heading', 'subheading', 'body'] as const

export type TextStyle = (typeof textStyles)[number]

export const markNames = ['bold', 'italic', 'underline', 'strike'] as const

export type MarkName = (typeof markNames)[number]

export const listKinds = ['bulletList', 'dashList', 'orderedList', 'taskList'] as const

export type ListKind = (typeof listKinds)[number]

type ListItemType = 'listItem' | 'taskItem'

const headingLevels = { title: 1, heading: 2, subheading: 3 } as const

export function textStyleOf(editor: Editor): TextStyle {
  for (const style of ['title', 'heading', 'subheading'] as const) {
    if (editor.isActive('heading', { level: headingLevels[style] })) {
      return style
    }
  }
  return 'body'
}

export function applyTextStyle(editor: Editor, style: TextStyle): void {
  const chain = editor.chain().focus()
  if (style === 'body') {
    chain.setParagraph().run()
  } else {
    chain.setHeading({ level: headingLevels[style] }).run()
  }
}

export function toggleMarkNamed(editor: Editor, mark: MarkName): void {
  editor.chain().focus().toggleMark(mark).run()
}

export function toggleListKind(editor: Editor, kind: ListKind): void {
  const chain = editor.chain().focus()
  switch (kind) {
    case 'bulletList':
      chain.toggleBulletList().run()
      return
    case 'dashList':
      chain.toggleList(dashListName, 'listItem').run()
      return
    case 'orderedList':
      chain.toggleOrderedList().run()
      return
    case 'taskList':
      chain.toggleTaskList().run()
      return
  }
}

function listItemTypeAt(editor: Editor): ListItemType | null {
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const name = $from.node(depth).type.name
    if (name === 'listItem' || name === 'taskItem') {
      return name
    }
  }
  return null
}

export function canIndent(editor: Editor): boolean {
  const type = listItemTypeAt(editor)
  return type !== null && editor.can().sinkListItem(type)
}

export function canOutdent(editor: Editor): boolean {
  const type = listItemTypeAt(editor)
  return type !== null && editor.can().liftListItem(type)
}

export function indent(editor: Editor): void {
  const type = listItemTypeAt(editor)
  if (type !== null) {
    editor.chain().focus().sinkListItem(type).run()
  }
}

export function outdent(editor: Editor): void {
  const type = listItemTypeAt(editor)
  if (type !== null) {
    editor.chain().focus().liftListItem(type).run()
  }
}
