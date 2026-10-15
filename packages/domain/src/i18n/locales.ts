export const locales = ['pt-BR', 'pt-PT', 'en-US', 'en-GB'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en-US'

const countryLocales: Readonly<Record<string, Locale>> = {
  BR: 'pt-BR',
  PT: 'pt-PT',
  AO: 'pt-PT',
  MZ: 'pt-PT',
  CV: 'pt-PT',
  GW: 'pt-PT',
  ST: 'pt-PT',
  TL: 'pt-PT',
  GB: 'en-GB',
  IE: 'en-GB',
  AU: 'en-GB',
  NZ: 'en-GB',
}

export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale === value)
}

export function localeForCountry(country: string): Locale {
  return countryLocales[country.trim().toUpperCase()] ?? defaultLocale
}

function languageLocale(tag: string): Locale | null {
  const [language, region = ''] = tag.trim().toLowerCase().split('-')
  if (language === 'pt') {
    return region === '' || region === 'br' ? 'pt-BR' : 'pt-PT'
  }
  if (language === 'en') {
    return ['gb', 'ie', 'au', 'nz'].includes(region) ? 'en-GB' : 'en-US'
  }
  return null
}

export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (header === null) {
    return null
  }
  const ranked = header
    .split(',')
    .map((part, index) => {
      const quality = /;\s*q=([\d.]+)/.exec(part)?.[1]
      return {
        tag: part.replace(/;.*$/, ''),
        quality: quality === undefined ? 1 : Number(quality),
        index,
      }
    })
    .filter((entry) => entry.tag.trim() !== '' && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
  for (const entry of ranked) {
    const locale = languageLocale(entry.tag)
    if (locale !== null) {
      return locale
    }
  }
  return null
}

export interface LocaleSignals {
  chosen: string | null
  country: string | null
  acceptLanguage: string | null
}

export function resolveLocale({ chosen, country, acceptLanguage }: LocaleSignals): Locale {
  if (isLocale(chosen)) {
    return chosen
  }
  if (country !== null && /^[a-z]{2}$/i.test(country.trim())) {
    return localeForCountry(country)
  }
  return localeFromAcceptLanguage(acceptLanguage) ?? defaultLocale
}
