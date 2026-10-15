import type { Locale } from '@mycogni/domain'
import type { Messages } from './messages'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
  }
}
