import { articleIds, trackIds, type ArticleId, type TrackId } from './catalog.ts'
import { articles } from './content/articles/articles.ts'
import { trackText } from './content/tracks/tracks.ts'
import type { ArticleText, ContentLanguage, StepText } from './content/types.ts'
import { meditationIds, type MeditationId } from './meditation-ids.ts'
import { meditationText } from './meditations.ts'

export type NarrationKey =
  | `article/${ArticleId}`
  | `step/${TrackId}/${string}`
  | `meditation/${MeditationId}/${string}`
  | 'preview'

export interface NarrationItem {
  key: NarrationKey
  title: string
  text: string
}

const previewTexts: Readonly<Record<ContentLanguage, string>> = {
  'pt-BR': 'Olá. Esta é a voz que vai ler os textos do Zen Space para você, com calma.',
  'pt-PT': 'Olá. Esta é a voz que vai ler os textos do Zen Space para si, com calma.',
  en: 'Hello. This is the voice that will read the Zen Space texts to you, calmly.',
}

const previewTitles: Readonly<Record<ContentLanguage, string>> = {
  'pt-BR': 'Amostra de voz',
  'pt-PT': 'Amostra de voz',
  en: 'Voice sample',
}

export function articleKey(id: ArticleId): NarrationKey {
  return `article/${id}`
}

export function stepKey(trackId: TrackId, stepId: string): NarrationKey {
  return `step/${trackId}/${stepId}`
}

export function meditationKey(id: MeditationId, index: number): NarrationKey {
  return `meditation/${id}/${String(index)}`
}

export function spokenText(text: string): string {
  return text
    .replace(/(\p{L}+)o\/a\b/gu, '$1o ou $1a')
    .replace(/\bo\/a\b/gu, 'o')
    .replace(/\b\d(?:-\d)+\b/g, (digits) => digits.split('-').join(', '))
}

function sentence(text: string): string {
  return /[.!?…:]$/u.test(text) ? text : `${text}.`
}

export function articleNarration(text: ArticleText): string {
  return [
    sentence(text.title),
    text.summary,
    ...text.sections.flatMap((section) => [
      ...(section.heading === undefined ? [] : [sentence(section.heading)]),
      ...section.paragraphs,
    ]),
  ]
    .map(spokenText)
    .join('\n\n')
}

export function stepNarration(text: StepText): string {
  return [sentence(text.title), text.body].map(spokenText).join('\n\n')
}

export function articleNarrationItem(id: ArticleId, language: ContentLanguage): NarrationItem {
  const text = articles[id].text[language]
  return { key: articleKey(id), title: text.title, text: articleNarration(text) }
}

export function stepNarrationItems(trackId: TrackId, language: ContentLanguage): NarrationItem[] {
  return Object.entries(trackText(language, trackId).steps).map(([stepId, text]) => ({
    key: stepKey(trackId, stepId),
    title: text.title,
    text: stepNarration(text),
  }))
}

export function meditationNarrationItems(
  id: MeditationId,
  language: ContentLanguage,
): NarrationItem[] {
  const text = meditationText(id, language)
  return text.lines.map((line, index) => ({
    key: meditationKey(id, index),
    title: `${text.title} · ${String(index + 1)}`,
    text: spokenText(line),
  }))
}

export function previewNarrationItem(language: ContentLanguage): NarrationItem {
  return { key: 'preview', title: previewTitles[language], text: previewTexts[language] }
}

export function narrationItems(language: ContentLanguage): NarrationItem[] {
  return [
    previewNarrationItem(language),
    ...articleIds.map((id) => articleNarrationItem(id, language)),
    ...trackIds.flatMap((trackId) => stepNarrationItems(trackId, language)),
    ...meditationIds.flatMap((id) => meditationNarrationItems(id, language)),
  ]
}
