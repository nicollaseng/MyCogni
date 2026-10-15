export const journalLimits = {
  title: 200,
  plainText: 100_000,
  bodyBytes: 512_000,
  imageBytes: 10 * 1024 * 1024,
  imagesPerEntry: 30,
  excerpt: 160,
} as const

export const journalBucket = 'journal'

export const journalImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export type JournalImageType = (typeof journalImageTypes)[number]

const extensions: Readonly<Record<JournalImageType, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function isJournalImageType(type: string): type is JournalImageType {
  return journalImageTypes.some((candidate) => candidate === type)
}

export function journalImageExtension(type: JournalImageType): string {
  return extensions[type]
}

export function isOwnJournalPath(path: string, userId: string, entryId: string): boolean {
  return new RegExp(`^${userId}/${entryId}/[0-9a-f-]{36}\\.(jpg|png|webp|gif)$`).test(path)
}

export function excerptOf(plainText: string, length: number = journalLimits.excerpt): string {
  const compact = plainText.replace(/\s+/g, ' ').trim()
  return compact.length <= length ? compact : `${compact.slice(0, length - 1).trimEnd()}…`
}

export const journalShareScopes = ['all', 'entries'] as const

export type JournalShareScope = (typeof journalShareScopes)[number]

export interface ShareWindow {
  revokedAt: Date | null
  expiresAt: Date | null
}

export function isShareActive({ revokedAt, expiresAt }: ShareWindow, now: Date): boolean {
  return revokedAt === null && (expiresAt === null || expiresAt.getTime() > now.getTime())
}
