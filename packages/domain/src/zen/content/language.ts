import type { Locale } from '../../i18n/locales.ts'
import type { ContentLanguage } from './types.ts'

const languages: Readonly<Record<Locale, ContentLanguage>> = {
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  'en-US': 'en',
  'en-GB': 'en',
}

export function contentLanguageOf(locale: Locale): ContentLanguage {
  return languages[locale]
}
