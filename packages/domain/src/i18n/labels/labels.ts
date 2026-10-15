import type { Locale } from '../locales.ts'
import { americanEnglish, britishEnglish } from './en.ts'
import type { LabelSet } from './label-set.ts'
import { brazilianPortuguese } from './pt-br.ts'
import { europeanPortuguese } from './pt-pt.ts'

const labelsByLocale: Readonly<Record<Locale, LabelSet>> = {
  'pt-BR': brazilianPortuguese,
  'pt-PT': europeanPortuguese,
  'en-US': americanEnglish,
  'en-GB': britishEnglish,
}

export function labelsFor(locale: Locale): LabelSet {
  return labelsByLocale[locale]
}
