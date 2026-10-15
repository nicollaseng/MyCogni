import { getRequestConfig } from 'next-intl/server'
import { requestLocale } from './locale'
import { messagesFor } from './messages'

export default getRequestConfig(async () => {
  const locale = await requestLocale()
  return { locale, messages: messagesFor(locale) }
})
