import { journalLimits } from './journal.ts'

export const journalImageNode = 'image'

export interface JournalTree {
  type: string
  attrs?: Readonly<Record<string, unknown>>
  content?: readonly JournalTree[]
}

const markup = /<\/?[a-z!?][^>]*>/i

export function isCaptionText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= journalLimits.caption && !markup.test(value)
}

export function captionOf(attrs: Readonly<Record<string, unknown>> | undefined): string {
  const caption = attrs?.caption
  return isCaptionText(caption) ? caption.trim() : ''
}

export function journalCaptions(node: JournalTree): string[] {
  const own = node.type === journalImageNode ? [captionOf(node.attrs)] : []
  const nested = (node.content ?? []).flatMap(journalCaptions)
  return [...own, ...nested].filter((caption) => caption !== '')
}
