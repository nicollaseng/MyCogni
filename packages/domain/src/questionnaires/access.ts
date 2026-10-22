import type { ProfessionalKind } from '../care/professionals.ts'
import type { Locale } from '../i18n/locales.ts'
import { catalogEntryOf, type QuestionnaireVariant } from './catalog.ts'
import { questionnaireText } from './texts/texts.ts'

export const unavailableReasons = ['satepsi_not_evaluated', 'no_official_text'] as const

export type UnavailableReason = (typeof unavailableReasons)[number]

export function isBlockedForKind(variant: QuestionnaireVariant, kind: ProfessionalKind): boolean {
  return kind === 'psychologist' && catalogEntryOf(variant).satepsi === 'nao_avaliado'
}

export function unavailableReasonOf(
  variant: QuestionnaireVariant,
  kind: ProfessionalKind,
  locale: Locale,
): UnavailableReason | null {
  if (isBlockedForKind(variant, kind)) {
    return 'satepsi_not_evaluated'
  }
  return questionnaireText(variant, locale) === null ? 'no_official_text' : null
}

export function isComplementarySource(kind: ProfessionalKind): boolean {
  return kind === 'psychologist'
}
