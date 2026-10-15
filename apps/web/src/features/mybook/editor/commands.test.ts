import { afterEach, beforeAll, describe, expect, it } from '@jest/globals'
import { TextSelection } from '@tiptap/pm/state'
import { Editor } from '@tiptap/react'
import { journalDocumentOf } from '../document'
import { insertPhoto } from './commands'
import { journalExtensions } from './extensions'

const editors: Editor[] = []

const photo = {
  path: 'user/entry/one.webp',
  src: 'https://x.y/one.webp',
  width: 1600,
  height: 1200,
}

function editorWith(text: string): Editor {
  const editor = new Editor({
    extensions: journalExtensions({ placeholder: '', photo: 'Foto', task: (value) => value }),
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
  })
  editors.push(editor)
  return editor
}

function blocksOf(editor: Editor): string[] {
  return (journalDocumentOf(editor.getJSON())?.content ?? []).map((node) => node.type)
}

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement('span').getClientRects()
  Range.prototype.getBoundingClientRect = () =>
    document.createElement('span').getBoundingClientRect()
})

afterEach(() => {
  editors.splice(0).forEach((editor) => {
    editor.destroy()
  })
})

describe('insertPhoto', () => {
  it('leaves the cursor on a new line after the photo so writing never replaces it', () => {
    const editor = editorWith('Fui ao parque.')
    editor.commands.focus('end')

    insertPhoto(editor, photo)
    editor.commands.insertContent('Depois, um café.')

    expect(blocksOf(editor)).toEqual(['paragraph', 'image', 'paragraph'])
    expect(editor.state.selection).toBeInstanceOf(TextSelection)
    expect(editor.getText()).toContain('Depois, um café.')
    expect(editor.getJSON().content.at(1)?.attrs).toMatchObject({ width: 1600, height: 1200 })
  })

  it('reuses the line that follows when the photo goes in the middle of the text', () => {
    const editor = editorWith('Antes depois')
    editor.commands.focus()
    editor.commands.setTextSelection(7)

    insertPhoto(editor, photo)

    expect(blocksOf(editor)).toEqual(['paragraph', 'image', 'paragraph'])
    expect(editor.state.selection.$from.parent.textContent).toBe('depois')
  })
})
