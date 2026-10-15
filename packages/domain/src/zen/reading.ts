import type { ArticleText } from './content/types.ts'

const wordsPerMinute = 200

export function wordCountOf(text: ArticleText): number {
  return [
    text.summary,
    ...text.sections.flatMap((section) => [section.heading ?? '', ...section.paragraphs]),
  ]
    .join(' ')
    .split(/\s+/)
    .filter((word) => word !== '').length
}

export function readingMinutes(text: ArticleText): number {
  return Math.max(1, Math.ceil(wordCountOf(text) / wordsPerMinute))
}
