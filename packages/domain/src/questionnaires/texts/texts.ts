import type { Locale } from '../../i18n/locales.ts'
import type { QuestionnaireVariant } from '../catalog.ts'
import { asrsTexts } from './asrs.ts'
import { k10Texts, k6Texts } from './kessler.ts'
import { pcl5Texts } from './pcl5.ts'
import { gad7Texts, phq8Texts, phq9Texts } from './phq.ts'
import type { QuestionnaireText, QuestionnaireTexts, TextLocale } from './text.ts'

const textsByVariant: Readonly<Record<QuestionnaireVariant, QuestionnaireTexts>> = {
  phq9: phq9Texts,
  phq8: phq8Texts,
  gad7: gad7Texts,
  pcl5: pcl5Texts,
  asrs6: asrsTexts,
  k10: k10Texts,
  k6: k6Texts,
}

export function textLocaleOf(locale: Locale): TextLocale {
  return locale === 'en-US' || locale === 'en-GB' ? 'en' : locale
}

export function questionnaireText(
  variant: QuestionnaireVariant,
  locale: Locale,
): QuestionnaireText | null {
  return textsByVariant[variant][textLocaleOf(locale)] ?? null
}
