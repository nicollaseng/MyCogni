import type { ArticleId, TrackId } from '@mycogni/domain'

export type ContentLanguage = 'pt-BR' | 'pt-PT' | 'en'

export interface Reference {
  citation: string
  url: string
}

export interface ArticleSection {
  heading?: string
  paragraphs: readonly string[]
}

export interface ArticleText {
  title: string
  summary: string
  sections: readonly [ArticleSection, ...ArticleSection[]]
}

export interface Article {
  id: ArticleId
  text: Readonly<Record<ContentLanguage, ArticleText>>
  references: readonly [Reference, ...Reference[]]
}

export interface StepText {
  title: string
  body: string
}

export interface TrackText {
  title: string
  summary: string
  steps: Readonly<Record<string, StepText>>
}

export type TrackTexts = Readonly<Record<TrackId, TrackText>>
