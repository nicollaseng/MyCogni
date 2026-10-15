import type { Locale } from '@mycogni/domain'
import { english } from './en.ts'
import { brazilianPortuguese, type ReportMessages } from './pt-br.ts'
import { europeanPortuguese } from './pt-pt.ts'

const messagesByLocale: Readonly<Record<Locale, ReportMessages>> = {
  'pt-BR': brazilianPortuguese,
  'pt-PT': europeanPortuguese,
  'en-US': english,
  'en-GB': english,
}

export function reportMessages(locale: Locale): ReportMessages {
  return messagesByLocale[locale]
}

export type { ReportMessages }
