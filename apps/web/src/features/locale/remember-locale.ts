import { locales } from '@mycogni/domain'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { localeCookie } from '@/i18n/locale'

const oneYear = 60 * 60 * 24 * 365

const metadataSchema = z.object({ locale: z.enum(locales) })

export async function rememberLocale(locale: string): Promise<void> {
  const parsed = z.enum(locales).safeParse(locale)
  if (!parsed.success) {
    return
  }
  const store = await cookies()
  store.set(localeCookie, parsed.data, { path: '/', maxAge: oneYear, sameSite: 'lax' })
}

export async function rememberLocaleOf(userMetadata: unknown): Promise<boolean> {
  const parsed = metadataSchema.safeParse(userMetadata)
  if (parsed.success) {
    await rememberLocale(parsed.data.locale)
  }
  return parsed.success
}
