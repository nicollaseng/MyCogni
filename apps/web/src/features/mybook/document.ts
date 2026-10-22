import {
  journalDocumentSchema,
  type JournalNode,
  type UpdateJournalEntryInput,
} from '@mycogni/contracts'
import { captionOf, journalImageNode } from '@mycogni/domain'
import { z } from 'zod'

export const imageNodeName = journalImageNode

export const galleryNodeName = 'gallery'

const textblockNames: ReadonlySet<string> = new Set(['paragraph', 'heading'])

export interface ImageSize {
  width: number
  height: number
}

export interface GalleryPhoto {
  path: string | null
  src: string | null
  width: number | null
  height: number | null
  caption: string
}

const galleryPhotoSchema = z.object({
  path: z.string().nullable(),
  src: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  caption: z.string(),
})

function pathOf(node: JournalNode): string | null {
  const path = node.attrs?.path
  return typeof path === 'string' && path !== '' ? path : null
}

function isPixels(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function imageSizeOf(
  attrs: Readonly<Record<string, unknown>> | undefined,
): ImageSize | null {
  const width = attrs?.width
  const height = attrs?.height
  return isPixels(width) && isPixels(height) ? { width, height } : null
}

function captionAttrs(node: JournalNode): { caption?: string } {
  const caption = captionOf(node.attrs)
  return caption === '' ? {} : { caption }
}

export function galleryPhotosOf(value: unknown): GalleryPhoto[] {
  const parsed = z.array(galleryPhotoSchema).safeParse(value)
  return parsed.success ? parsed.data : []
}

export function photoOf(image: JournalNode): GalleryPhoto {
  const src = image.attrs?.src
  const size = imageSizeOf(image.attrs)
  return {
    path: pathOf(image),
    src: typeof src === 'string' && src !== '' ? src : null,
    width: size?.width ?? null,
    height: size?.height ?? null,
    caption: captionOf(image.attrs),
  }
}

function imageOf(photo: GalleryPhoto): JournalNode {
  return {
    type: imageNodeName,
    attrs: {
      path: photo.path,
      src: photo.src,
      ...imageSizeOf({ width: photo.width, height: photo.height }),
      ...(photo.caption === '' ? {} : { caption: photo.caption }),
    },
  }
}

function mapImages(node: JournalNode, map: (image: JournalNode) => JournalNode): JournalNode {
  if (node.type === imageNodeName) {
    return map(node)
  }
  if (node.content === undefined) {
    return node
  }
  return { ...node, content: node.content.map((child) => mapImages(child, map)) }
}

function collectImagePaths(node: JournalNode, paths: string[]): string[] {
  const path = node.type === imageNodeName ? pathOf(node) : null
  if (path !== null && !paths.includes(path)) {
    paths.push(path)
  }
  for (const child of node.content ?? []) {
    collectImagePaths(child, paths)
  }
  return paths
}

function inlineText(node: JournalNode): string {
  if (node.type === 'hardBreak') {
    return '\n'
  }
  return node.text ?? (node.content ?? []).map(inlineText).join('')
}

function collectLines(node: JournalNode, lines: string[]): string[] {
  if (textblockNames.has(node.type)) {
    return [...lines, inlineText(node)]
  }
  if (node.type === imageNodeName) {
    const caption = captionOf(node.attrs)
    return caption === '' ? lines : [...lines, caption]
  }
  return (node.content ?? []).reduce((collected, child) => collectLines(child, collected), lines)
}

export function imagePathsOf(doc: JournalNode): string[] {
  return collectImagePaths(doc, [])
}

export function plainTextOf(doc: JournalNode): string {
  return collectLines(doc, []).join('\n').trim()
}

export function withoutImageSources(doc: JournalNode): JournalNode {
  return mapImages(doc, (image) => ({
    ...image,
    attrs: { path: pathOf(image), ...imageSizeOf(image.attrs), ...captionAttrs(image) },
  }))
}

export function withImageSources(
  doc: JournalNode,
  urls: Readonly<Record<string, string>>,
): JournalNode {
  return mapImages(doc, (image) => {
    const path = pathOf(image)
    return {
      ...image,
      attrs: {
        path,
        src: path === null ? null : (urls[path] ?? null),
        ...imageSizeOf(image.attrs),
        ...captionAttrs(image),
      },
    }
  })
}

export function withPhotoCaption(doc: JournalNode, path: string, caption: string): JournalNode {
  return mapImages(doc, (image) =>
    pathOf(image) === path ? { ...image, attrs: { ...image.attrs, caption } } : image,
  )
}

export function withoutPhoto(doc: JournalNode, path: string): JournalNode {
  if (doc.content === undefined) {
    return doc
  }
  return {
    ...doc,
    content: doc.content
      .filter((child) => child.type !== imageNodeName || pathOf(child) !== path)
      .map((child) => withoutPhoto(child, path)),
  }
}

function groupedContent(content: readonly JournalNode[]): JournalNode[] {
  return content.reduce<JournalNode[]>((grouped, child) => {
    if (child.type !== imageNodeName) {
      return [...grouped, groupGalleries(child)]
    }
    const last = grouped.at(-1)
    if (last?.type !== galleryNodeName) {
      return [...grouped, { type: galleryNodeName, attrs: { photos: [photoOf(child)] } }]
    }
    const photos = [...galleryPhotosOf(last.attrs?.photos), photoOf(child)]
    return [...grouped.slice(0, -1), { ...last, attrs: { photos } }]
  }, [])
}

export function groupGalleries(node: JournalNode): JournalNode {
  return node.content === undefined ? node : { ...node, content: groupedContent(node.content) }
}

export function flattenGalleries(node: JournalNode): JournalNode {
  if (node.content === undefined) {
    return node
  }
  return {
    ...node,
    content: node.content.flatMap((child) =>
      child.type === galleryNodeName
        ? galleryPhotosOf(child.attrs?.photos).map(imageOf)
        : [flattenGalleries(child)],
    ),
  }
}

export function journalDocumentOf(content: unknown): JournalNode | null {
  const parsed = journalDocumentSchema.safeParse(content)
  return parsed.success ? parsed.data : null
}

export function storedBodyOf(content: unknown): unknown {
  const doc = journalDocumentOf(content)
  return doc === null ? content : flattenGalleries(doc)
}

export function draftOf(title: string, doc: JournalNode): UpdateJournalEntryInput {
  const trimmed = title.trim()
  const flat = flattenGalleries(doc)
  return {
    title: trimmed === '' ? null : trimmed,
    body: withoutImageSources(flat),
    plainText: plainTextOf(flat),
    imagePaths: imagePathsOf(flat),
  }
}

export function isBlankDraft(draft: UpdateJournalEntryInput): boolean {
  return draft.title === null && draft.plainText === '' && draft.imagePaths.length === 0
}
