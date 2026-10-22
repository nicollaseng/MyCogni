import type { Locale } from '../../i18n/locales.ts'
import type { InstrumentId } from '../instrument.ts'
import { instruments } from '../scoring.ts'
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
  const { domain, items } = instruments[id]
  const full = textsByLocale[locale][domain]
  return { ...full, items: full.items.filter((_, index) => items.includes(index)) }
}
