import type { Locale } from '@mycogni/domain'
import { messages as enGB } from './en-GB'
import { messages as enUS } from './en-US'
import { messages as ptBR, type Messages } from './pt-BR'
import { messages as ptPT } from './pt-PT'

const messagesByLocale: Readonly<Record<Locale, Messages>> = {
  'pt-BR': ptBR,
  'pt-PT': ptPT,
  'en-US': enUS,
  'en-GB': enGB,
}

export function messagesFor(locale: Locale): Messages {
  return messagesByLocale[locale]
}

export type { Messages }
