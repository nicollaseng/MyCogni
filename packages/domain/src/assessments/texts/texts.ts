import type { Locale } from '../../i18n/locales.ts'
import type { InstrumentId } from '../instrument.ts'
import { english } from './en.ts'
import type { InstrumentText, InstrumentTexts } from './instrument-text.ts'
import { brazilianPortuguese } from './pt-br.ts'
import { europeanPortuguese } from './pt-pt.ts'

const textsByLocale: Readonly<Record<Locale, InstrumentTexts>> = {
  'pt-BR': brazilianPortuguese,
  'pt-PT': europeanPortuguese,
  'en-US': english,
  'en-GB': english,
}

export function instrumentText(locale: Locale, id: InstrumentId): InstrumentText {
  return textsByLocale[locale][id]
}
