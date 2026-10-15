const dayInMs = 24 * 60 * 60 * 1000

export const teaserDays = 14

export interface PeriodLabeled<T> {
  reading: T
  period: string
}

export function readingAnchor(id: string): string {
  return `reading-${id}`
}

export function readingIdOfHash(hash: string): string | null {
  const prefix = `#${readingAnchor('')}`
  return hash.startsWith(prefix) && hash.length > prefix.length ? hash.slice(prefix.length) : null
}

export function isRecentReading(createdAt: string, now: Date, days = teaserDays): boolean {
  return now.getTime() - new Date(createdAt).getTime() <= days * dayInMs
}

export function firstSentence(text: string, locale: string): string {
  const trimmed = text.trim()
  const [first] = new Intl.Segmenter(locale, { granularity: 'sentence' }).segment(trimmed)
  return first === undefined ? trimmed : first.segment.trim()
}
