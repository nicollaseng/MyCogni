import type { Locale } from '@mycogni/domain'
import type { ContentLanguage } from './types'

const languages: Readonly<Record<Locale, ContentLanguage>> = {
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  'en-US': 'en',
  'en-GB': 'en',
}

export function contentLanguageOf(locale: Locale): ContentLanguage {
  return languages[locale]
}
