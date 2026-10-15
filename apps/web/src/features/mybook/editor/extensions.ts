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
import { imageNodeName, imageSizeOf } from '../document'

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

function pixelsOf(element: HTMLElement, name: 'width' | 'height'): number | null {
  const value = Number(element.getAttribute(name))
  return Number.isInteger(value) && value > 0 ? value : null
}

function sizingOf(attrs: Record<string, unknown>): Record<string, string> {
  const size = imageSizeOf(attrs)
  if (size === null) {
    return {}
  }
  return {
    width: String(size.width),
    height: String(size.height),
    style: `--photo-width: ${String(size.width)}px; --photo-ratio: ${String(size.width / size.height)}`,
  }
}

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
      width: { default: null, rendered: false, parseHTML: (element) => pixelsOf(element, 'width') },
      height: {
        default: null,
        rendered: false,
        parseHTML: (element) => pixelsOf(element, 'height'),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'img[data-path]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, sizingOf(node.attrs), {
        loading: 'lazy',
        decoding: 'async',
      }),
    ]
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
