import { mergeAttributes, Node, ReactNodeViewRenderer } from '@tiptap/react'
import { galleryNodeName, galleryPhotosOf, type GalleryPhoto } from '../document'
import { GalleryView } from './gallery-view'

function pixelsOf(element: HTMLElement, name: 'width' | 'height'): number | null {
  const value = Number(element.getAttribute(name))
  return Number.isInteger(value) && value > 0 ? value : null
}

function photosFromHtml(element: HTMLElement): GalleryPhoto[] {
  if (element.tagName === 'IMG') {
    return [
      {
        path: element.getAttribute('data-path'),
        src: element.getAttribute('src'),
        width: pixelsOf(element, 'width'),
        height: pixelsOf(element, 'height'),
        caption: '',
      },
    ]
  }
  try {
    const stored: unknown = JSON.parse(element.getAttribute('data-photos') ?? '[]')
    return galleryPhotosOf(stored)
  } catch {
    return []
  }
}

export const Gallery = Node.create({
  name: galleryNodeName,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      photos: {
        default: [],
        parseHTML: photosFromHtml,
        renderHTML: (attributes) => ({
          'data-photos': JSON.stringify(galleryPhotosOf(attributes.photos)),
        }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-gallery]' }, { tag: 'img[data-path]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-gallery': '' })]
  },
  addNodeView() {
    return ReactNodeViewRenderer(GalleryView)
  },
})
