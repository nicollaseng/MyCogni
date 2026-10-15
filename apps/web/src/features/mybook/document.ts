import {
  journalDocumentSchema,
  type JournalNode,
  type UpdateJournalEntryInput,
} from '@mycogni/contracts'

export const imageNodeName = 'image'

const textblockNames: ReadonlySet<string> = new Set(['paragraph', 'heading'])

function pathOf(node: JournalNode): string | null {
  const path = node.attrs?.path
  return typeof path === 'string' && path !== '' ? path : null
}

export interface ImageSize {
  width: number
  height: number
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
    lines.push(inlineText(node))
    return lines
  }
  for (const child of node.content ?? []) {
    collectLines(child, lines)
  }
  return lines
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
    attrs: { path: pathOf(image), ...imageSizeOf(image.attrs) },
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
      },
    }
  })
}

export function journalDocumentOf(content: unknown): JournalNode | null {
  const parsed = journalDocumentSchema.safeParse(content)
  return parsed.success ? parsed.data : null
}

export function draftOf(title: string, doc: JournalNode): UpdateJournalEntryInput {
  const trimmed = title.trim()
  return {
    title: trimmed === '' ? null : trimmed,
    body: withoutImageSources(doc),
    plainText: plainTextOf(doc),
    imagePaths: imagePathsOf(doc),
  }
}

export function isBlankDraft(draft: UpdateJournalEntryInput): boolean {
  return draft.title === null && draft.plainText === '' && draft.imagePaths.length === 0
}
