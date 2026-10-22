import { journalNodeSchema, type JournalNode } from '@mycogni/contracts'
import { csvDocument, dayKey, escapeHtml, fileSlug, uniqueName } from '@mycogni/domain'
import type { MemoryRecord } from '../memories/memory.repository.ts'
import type { ExportCopy } from './export-copy.ts'
import type {
  ExportCheckIn,
  ExportConversation,
  ExportData,
  ExportPage,
} from './export-collector.ts'

export interface ArchivePlan {
  pages: { page: ExportPage; file: string }[]
  photos: { path: string; file: string; page: string }[]
  conversations: { conversation: ExportConversation; file: string }[]
  avatar: { path: string; file: string } | null
  documents: { path: string; file: string }[]
}

function extensionOf(path: string): string {
  const match = /\.([a-z0-9]{2,5})$/i.exec(path)
  return match === null ? '' : `.${(match[1] ?? '').toLowerCase()}`
}

function firstWords(text: string, count: number): string {
  return text.split(/\s+/).slice(0, count).join(' ')
}

export function archivePlan(data: ExportData, copy: ExportCopy): ArchivePlan {
  const zone = data.profile.timezone
  const used = new Set<string>()
  const photos: ArchivePlan['photos'] = []
  const pages = data.pages.map((page) => {
    const day = dayKey(page.createdAt, zone)
    const slug = fileSlug(page.title ?? firstWords(page.plainText, 6), copy.untitledPage)
    const file = uniqueName(`mybook/${day}-${slug}.html`, used)
    const base = file.slice('mybook/'.length, -'.html'.length)
    page.imagePaths.forEach((path, index) => {
      photos.push({
        path,
        page: page.id,
        file: uniqueName(`fotos/${base}-${String(index + 1)}${extensionOf(path)}`, used),
      })
    })
    return { page, file }
  })
  const conversations = data.conversations.map((conversation) => {
    const opening = conversation.messages.find((message) => message.role === 'user')
    const slug = fileSlug(
      opening === undefined ? null : firstWords(opening.content, 6),
      copy.untitledConversation,
    )
    return {
      conversation,
      file: uniqueName(`conversas/${dayKey(conversation.createdAt, zone)}-${slug}.md`, used),
    }
  })
  const avatarPath = data.profile.avatarPath
  return {
    pages,
    photos,
    conversations,
    avatar:
      avatarPath === null
        ? null
        : { path: avatarPath, file: `perfil/foto${extensionOf(avatarPath)}` },
    documents: data.documents.map((document) => ({
      path: document.path,
      file: uniqueName(`documentos/${document.fileName.replace(/[\\/]/g, '-')}`, used),
    })),
  }
}

export function checkInsCsv(
  checkIns: readonly ExportCheckIn[],
  copy: ExportCopy,
  timeZone: string,
): string {
  return csvDocument(
    copy.checkInHeader,
    checkIns.map((checkIn) => [
      `${dayKey(checkIn.recordedAt, timeZone)} ${checkIn.recordedAt.toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' })}`,
      checkIn.moodLevel,
      checkIn.emotions.join('; '),
      checkIn.contexts.join('; '),
      checkIn.note,
      checkIn.addenda.map((addendum) => addendum.text).join(' | '),
    ]),
  )
}

export function memoriesCsv(
  memories: readonly MemoryRecord[],
  copy: ExportCopy,
  timeZone: string,
): string {
  return csvDocument(
    copy.memoryHeader,
    memories.map((memory) => [
      memory.content,
      memory.kind,
      memory.origin,
      memory.status,
      dayKey(memory.createdAt, timeZone),
      memory.sources.map((source) => `${source.kind} ${dayKey(source.at, timeZone)}`).join('; '),
    ]),
  )
}

const markTags: Readonly<Record<string, string>> = {
  bold: 'strong',
  italic: 'em',
  strike: 's',
  underline: 'u',
}

const blockTags: Readonly<Record<string, string>> = {
  paragraph: 'p',
  blockquote: 'blockquote',
  bulletList: 'ul',
  dashList: 'ul',
  orderedList: 'ol',
  listItem: 'li',
  taskList: 'ul',
}

function textHtml(node: JournalNode): string {
  return (node.marks ?? []).reduce(
    (html, mark) => {
      const tag = markTags[mark.type]
      return tag === undefined ? html : `<${tag}>${html}</${tag}>`
    },
    escapeHtml(node.text ?? ''),
  )
}

function nodeHtml(node: JournalNode, photos: ReadonlyMap<string, string>, alt: string): string {
  const children = (node.content ?? []).map((child) => nodeHtml(child, photos, alt)).join('')
  switch (node.type) {
    case 'text':
      return textHtml(node)
    case 'hardBreak':
      return '<br>'
    case 'horizontalRule':
      return '<hr>'
    case 'heading': {
      const level = node.attrs?.level
      const tag = level === 1 || level === 2 || level === 3 ? `h${String(level + 1)}` : 'h4'
      return `<${tag}>${children}</${tag}>`
    }
    case 'taskItem':
      return `<li>${node.attrs?.checked === true ? '☑' : '☐'} ${children}</li>`
    case 'image': {
      const path = node.attrs?.path
      const file = typeof path === 'string' ? photos.get(path) : undefined
      return file === undefined
        ? ''
        : `<figure><img src="../${escapeHtml(file)}" alt="${escapeHtml(alt)}"></figure>`
    }
  }
  const tag = blockTags[node.type]
  return tag === undefined ? children : `<${tag}>${children}</${tag}>`
}

export function pageHtml(
  page: ExportPage,
  photos: ReadonlyMap<string, string>,
  copy: ExportCopy,
  locale: string,
  timeZone: string,
): string {
  const parsed = journalNodeSchema.safeParse(page.body)
  const body = parsed.success
    ? nodeHtml(parsed.data, photos, copy.photo)
    : page.plainText
        .split(/\n+/)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('')
  const title = escapeHtml(page.title ?? dayKey(page.createdAt, timeZone))
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'">
<title>${title}</title>
<style>
body { margin: 0 auto; max-width: 42rem; padding: 2rem 1.25rem 4rem; font: 17px/1.6 Georgia, serif; color: #1e2925; background: #f6f7f3; }
h1, h2, h3, h4 { line-height: 1.2; }
p.meta { font: 13px/1.5 Arial, sans-serif; color: #5b6762; }
img { max-width: 100%; height: auto; border-radius: 6px; }
figure { margin: 1.5rem 0; }
blockquote { margin: 1rem 0; padding-left: 1rem; border-left: 2px solid #c9d1c8; color: #3d4a45; }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">${escapeHtml(copy.created)} ${escapeHtml(dayKey(page.createdAt, timeZone))} · ${escapeHtml(copy.updated)} ${escapeHtml(dayKey(page.updatedAt, timeZone))}</p>
${body}
</body>
</html>
`
}

function markdownText(text: string): string {
  return text.replace(/[<>]/g, (character) => `\\${character}`)
}

export function conversationMarkdown(
  conversation: ExportConversation,
  copy: ExportCopy,
  timeZone: string,
): string {
  const speaker = (role: string) =>
    role === 'user' ? copy.you : role === 'assistant' ? copy.cogni : copy.notice
  const lines = conversation.messages.map(
    (message) =>
      `**${speaker(message.role)}** · ${dayKey(message.createdAt, timeZone)}\n\n${markdownText(message.content)}\n`,
  )
  return `# ${copy.cogni} · ${dayKey(conversation.createdAt, timeZone)}\n\n${lines.join('\n')}`
}
