import { afterEach, beforeAll, describe, expect, it } from '@jest/globals'
import type { JournalNode } from '@mycogni/contracts'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { Editor } from '@tiptap/react'
import { galleryPhotosOf, type GalleryPhoto } from '../document'
import { editorContentOf, journalExtensions } from '../editor/extensions'
import {
  insertPhotos,
  pagePhotosOf,
  photoCountOf,
  removePhoto,
  setPhotoCaption,
} from './photo-commands'

const editors: Editor[] = []

function photo(name: string, caption = ''): GalleryPhoto {
  return { path: `user/entry/${name}.webp`, src: null, width: 1600, height: 1200, caption }
}

function paragraph(text: string): JournalNode {
  return { type: 'paragraph', content: [{ type: 'text', text }] }
}

function editorWith(content: JournalNode[]): Editor {
  const editor = new Editor({
    extensions: journalExtensions({ placeholder: '', task: (value) => value }),
    content: editorContentOf({ type: 'doc', content }),
  })
  editors.push(editor)
  return editor
}

function blocksOf(editor: Editor): string[] {
  return editor.getJSON().content.map((node) => node.type)
}

function namesOf(editor: Editor): (string | null)[] {
  return pagePhotosOf(editor.state.doc).map((item) => item.path)
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

describe('insertPhotos', () => {
  it('starts a gallery at the cursor and leaves a new line after it for writing', () => {
    const editor = editorWith([paragraph('Fui ao parque.')])
    editor.commands.focus('end')

    insertPhotos(editor, [photo('one', 'Lago')])
    editor.commands.insertContent('Depois, um café.')

    expect(blocksOf(editor)).toEqual(['paragraph', 'gallery', 'paragraph'])
    expect(editor.state.selection).toBeInstanceOf(TextSelection)
    expect(editor.getText()).toContain('Depois, um café.')
    expect(galleryPhotosOf(editor.getJSON().content[1]?.attrs?.photos)).toEqual([
      photo('one', 'Lago'),
    ])
  })

  it('reuses the line that follows when the photos go in the middle of the text', () => {
    const editor = editorWith([paragraph('Antes depois')])
    editor.commands.focus()
    editor.commands.setTextSelection(7)

    insertPhotos(editor, [photo('one')])

    expect(blocksOf(editor)).toEqual(['paragraph', 'gallery', 'paragraph'])
    expect(editor.state.selection.$from.parent.textContent).toBe('depois')
  })

  it('adds photos to the gallery right before the cursor, one upload after another', () => {
    const editor = editorWith([paragraph('Praia')])
    editor.commands.focus('end')

    insertPhotos(editor, [photo('one')])
    insertPhotos(editor, [photo('two')])
    insertPhotos(editor, [photo('three')])

    expect(blocksOf(editor)).toEqual(['paragraph', 'gallery', 'paragraph'])
    expect(namesOf(editor)).toEqual([
      'user/entry/one.webp',
      'user/entry/two.webp',
      'user/entry/three.webp',
    ])
    expect(photoCountOf(editor.state.doc)).toBe(3)
  })

  it('puts photos in front of the gallery right after the cursor', () => {
    const editor = editorWith([
      paragraph('Antes'),
      { type: 'image', attrs: { path: 'user/entry/two.webp' } },
    ])
    editor.commands.setTextSelection(3)

    insertPhotos(editor, [photo('one')])

    expect(blocksOf(editor)).toEqual(['paragraph', 'gallery', 'paragraph'])
    expect(namesOf(editor)).toEqual(['user/entry/one.webp', 'user/entry/two.webp'])
  })

  it('adds photos to a selected gallery', () => {
    const editor = editorWith([
      paragraph('Antes'),
      { type: 'image', attrs: { path: 'user/entry/one.webp' } },
      paragraph('Depois'),
    ])
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 7)))

    insertPhotos(editor, [photo('two')])

    expect(namesOf(editor)).toEqual(['user/entry/one.webp', 'user/entry/two.webp'])
  })
})

describe('changing photos', () => {
  const legacy: JournalNode[] = [
    paragraph('Praia'),
    { type: 'image', attrs: { path: 'user/entry/one.webp' } },
    { type: 'image', attrs: { path: 'user/entry/two.webp', caption: 'Mar' } },
    paragraph('Depois'),
    { type: 'image', attrs: { path: 'user/entry/three.webp' } },
  ]

  it('reads the photos of older pages in reading order', () => {
    const editor = editorWith(legacy)

    expect(blocksOf(editor)).toEqual(['paragraph', 'gallery', 'paragraph', 'gallery'])
    expect(pagePhotosOf(editor.state.doc).map((item) => item.caption)).toEqual(['', 'Mar', ''])
  })

  it('edits the caption of one photo', () => {
    const editor = editorWith(legacy)

    expect(setPhotoCaption(editor, 'user/entry/one.webp', 'Areia')).toBe(true)
    expect(pagePhotosOf(editor.state.doc).map((item) => item.caption)).toEqual(['Areia', 'Mar', ''])
    expect(setPhotoCaption(editor, 'user/entry/none.webp', 'x')).toBe(false)
  })

  it('removes one photo and the gallery that it leaves empty', () => {
    const editor = editorWith(legacy)

    expect(removePhoto(editor, 'user/entry/two.webp')).toBe(true)
    expect(namesOf(editor)).toEqual(['user/entry/one.webp', 'user/entry/three.webp'])

    expect(removePhoto(editor, 'user/entry/three.webp')).toBe(true)
    expect(blocksOf(editor)).toEqual(['paragraph', 'gallery', 'paragraph', 'paragraph'])
    expect(removePhoto(editor, 'user/entry/three.webp')).toBe(false)
  })
})
