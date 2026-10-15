import { resolveLocale, type Locale } from '@mycogni/domain'
import { cookies, headers } from 'next/headers'
import { clientIp, countryOfIp } from './country'

export const localeCookie = 'MYCOGNI_LOCALE'

const countryHeaders = ['cf-ipcountry', 'x-vercel-ip-country', 'cloudfront-viewer-country']

export async function requestLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const chosen = cookieStore.get(localeCookie)?.value ?? null
  const edgeCountry = countryHeaders.map((name) => headerStore.get(name)).find(Boolean) ?? null
  const ip = clientIp(headerStore.get('x-forwarded-for'), headerStore.get('x-real-ip'))
  return resolveLocale({
    chosen,
    country: edgeCountry ?? (ip === null ? null : countryOfIp(ip)),
    acceptLanguage: headerStore.get('accept-language'),
  })
}
