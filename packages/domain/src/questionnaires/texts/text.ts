export type TextLocale = 'pt-BR' | 'pt-PT' | 'en'

export interface QuestionnaireOption {
  label: string
  value: number
}

export interface TextSource {
  document: string
  url: string
  citation: string
  licence: string
  attribution: string | null
  retrievedOn: string
}

export interface QuestionnaireText {
  title: string
  instructions: string
  lead: string
  stem: string | null
  items: readonly string[]
  standaloneItems: readonly number[]
  options: readonly QuestionnaireOption[]
  notice: string | null
  source: TextSource
}

export type QuestionnaireTexts = Readonly<Partial<Record<TextLocale, QuestionnaireText>>>
