import type { Node as DocumentNode } from '@tiptap/pm/model'
import { NodeSelection, TextSelection, type EditorState } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/react'
import { galleryNodeName, galleryPhotosOf, type GalleryPhoto } from '../document'

interface LocatedGallery {
  pos: number
  photos: GalleryPhoto[]
}

type Side = 'before' | 'after'

interface Neighbour extends LocatedGallery {
  side: Side
}

function galleriesOf(doc: DocumentNode): LocatedGallery[] {
  const found: LocatedGallery[] = []
  doc.descendants((node, pos) => {
    if (node.type.name !== galleryNodeName) {
      return true
    }
    found.push({ pos, photos: galleryPhotosOf(node.attrs.photos) })
    return false
  })
  return found
}

export function pagePhotosOf(doc: DocumentNode): GalleryPhoto[] {
  return galleriesOf(doc).flatMap((gallery) => gallery.photos)
}

export function photoCountOf(doc: DocumentNode): number {
  return pagePhotosOf(doc).length
}

function galleryHolding(doc: DocumentNode, path: string): LocatedGallery | null {
  return galleriesOf(doc).find((gallery) => gallery.photos.some((p) => p.path === path)) ?? null
}

function neighbourOf(state: EditorState): Neighbour | null {
  const { selection } = state
  if (selection instanceof NodeSelection && selection.node.type.name === galleryNodeName) {
    return {
      pos: selection.from,
      photos: galleryPhotosOf(selection.node.attrs.photos),
      side: 'after',
    }
  }
  const { $from } = selection
  if ($from.depth === 0 || !$from.parent.isTextblock) {
    return null
  }
  const start = $from.before()
  const end = $from.after()
  const before = state.doc.resolve(start).nodeBefore
  if (before?.type.name === galleryNodeName) {
    return {
      pos: start - before.nodeSize,
      photos: galleryPhotosOf(before.attrs.photos),
      side: 'after',
    }
  }
  const after = state.doc.resolve(end).nodeAfter
  if (after?.type.name === galleryNodeName) {
    return { pos: end, photos: galleryPhotosOf(after.attrs.photos), side: 'before' }
  }
  return null
}

function setPhotos(editor: Editor, pos: number, photos: GalleryPhoto[]): void {
  editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { photos }))
}

export function insertPhotos(editor: Editor, photos: readonly GalleryPhoto[]): void {
  const neighbour = neighbourOf(editor.state)
  if (neighbour !== null) {
    setPhotos(
      editor,
      neighbour.pos,
      neighbour.side === 'after'
        ? [...neighbour.photos, ...photos]
        : [...photos, ...neighbour.photos],
    )
    return
  }
  editor
    .chain()
    .focus()
    .insertContent({ type: galleryNodeName, attrs: { photos } })
    .command(({ tr }) => {
      const paragraph = tr.doc.type.schema.nodes.paragraph
      if (!(tr.selection instanceof NodeSelection) || paragraph === undefined) {
        return true
      }
      const end = tr.selection.to
      if (tr.doc.resolve(end).nodeAfter?.isTextblock !== true) {
        tr.insert(end, paragraph.create())
      }
      tr.setSelection(TextSelection.create(tr.doc, end + 1))
      return true
    })
    .scrollIntoView()
    .run()
}

export function setPhotoCaption(editor: Editor, path: string, caption: string): boolean {
  const gallery = galleryHolding(editor.state.doc, path)
  if (gallery === null) {
    return false
  }
  setPhotos(
    editor,
    gallery.pos,
    gallery.photos.map((photo) => (photo.path === path ? { ...photo, caption } : photo)),
  )
  return true
}

export function removePhoto(editor: Editor, path: string): boolean {
  const gallery = galleryHolding(editor.state.doc, path)
  if (gallery === null) {
    return false
  }
  const rest = gallery.photos.filter((photo) => photo.path !== path)
  if (rest.length > 0) {
    setPhotos(editor, gallery.pos, rest)
    return true
  }
  const node = editor.state.doc.nodeAt(gallery.pos)
  editor.view.dispatch(editor.state.tr.delete(gallery.pos, gallery.pos + (node?.nodeSize ?? 1)))
  return true
}
