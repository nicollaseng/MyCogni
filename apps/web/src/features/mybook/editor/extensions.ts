import type { JournalNode } from '@mycogni/contracts'
import Image from '@tiptap/extension-image'
import { BulletList, TaskItem, TaskList } from '@tiptap/extension-list'
import { Placeholder } from '@tiptap/extensions'
import {
  mergeAttributes,
  wrappingInputRule,
  type Extensions,
  type JSONContent,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { imageNodeName } from '../document'

export const dashListName = 'dashList'

const BulletPoints = BulletList.extend({
  addInputRules() {
    return [wrappingInputRule({ find: /^\s*([*+•])\s$/, type: this.type })]
  },
})

const DashList = BulletList.extend({
  name: dashListName,
  parseHTML() {
    return [{ tag: 'ul[data-variant="dash"]', priority: 60 }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'ul',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-variant': 'dash' }),
      0,
    ]
  },
  addCommands() {
    return {}
  },
  addKeyboardShortcuts() {
    return {}
  },
  addInputRules() {
    return [wrappingInputRule({ find: /^\s*-\s$/, type: this.type })]
  },
})

const JournalImage = Image.extend({
  name: imageNodeName,
  addAttributes() {
    return {
      src: { default: null },
      path: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-path'),
        renderHTML: (attributes) => {
          const path: unknown = attributes.path
          return typeof path === 'string' ? { 'data-path': path } : {}
        },
      },
    }
  },
  parseHTML() {
    return [{ tag: 'img[data-path]' }]
  },
  addInputRules() {
    return []
  },
})

interface JournalLabels {
  placeholder: string
  photo: string
  task: (text: string) => string
}

export function journalExtensions({ placeholder, photo, task }: JournalLabels): Extensions {
  return [
    StarterKit.configure({
      bulletList: false,
      code: false,
      codeBlock: false,
      link: false,
      heading: { levels: [1, 2, 3] },
      listKeymap: {
        listTypes: [
          { itemName: 'listItem', wrapperNames: ['bulletList', dashListName, 'orderedList'] },
          { itemName: 'taskItem', wrapperNames: ['taskList'] },
        ],
      },
    }),
    BulletPoints,
    DashList,
    TaskList,
    TaskItem.configure({
      nested: true,
      a11y: { checkboxLabel: (node) => task(node.textContent) },
    }),
    JournalImage.configure({ HTMLAttributes: { alt: photo } }),
    Placeholder.configure({ placeholder }),
  ]
}

export function editorContentOf(node: JournalNode): JSONContent {
  const content = node.content?.map(editorContentOf)
  return {
    type: node.type,
    attrs: node.attrs,
    content:
      node.type === 'doc' && (content ?? []).length === 0 ? [{ type: 'paragraph' }] : content,
    marks: node.marks,
    text: node.text,
  }
}
