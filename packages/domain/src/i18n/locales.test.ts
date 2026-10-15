import { describe, expect, it } from '@jest/globals'
import { isLocale, localeForCountry, localeFromAcceptLanguage, resolveLocale } from './locales.ts'

describe('localeForCountry', () => {
  it.each([
    ['BR', 'pt-BR'],
    ['PT', 'pt-PT'],
    ['ao', 'pt-PT'],
    ['MZ', 'pt-PT'],
    ['GB', 'en-GB'],
    ['IE', 'en-GB'],
    ['US', 'en-US'],
    ['DE', 'en-US'],
  ])('maps %s to %s', (country, locale) => {
    expect(localeForCountry(country)).toBe(locale)
  })
})

describe('localeFromAcceptLanguage', () => {
  it('follows the preference order and quality of the browser', () => {
    expect(localeFromAcceptLanguage('fr-FR,fr;q=0.9,pt-PT;q=0.8,en;q=0.7')).toBe('pt-PT')
    expect(localeFromAcceptLanguage('en-GB;q=0.5, pt-BR;q=0.9')).toBe('pt-BR')
    expect(localeFromAcceptLanguage('en-GB, pt-BR')).toBe('en-GB')
  })

  it('reads plain Portuguese as Brazilian and plain English as American', () => {
    expect(localeFromAcceptLanguage('pt')).toBe('pt-BR')
    expect(localeFromAcceptLanguage('en')).toBe('en-US')
    expect(localeFromAcceptLanguage('en-AU')).toBe('en-GB')
  })

  it('has no answer for other languages or a missing header', () => {
    expect(localeFromAcceptLanguage('de-DE,fr;q=0.8')).toBeNull()
    expect(localeFromAcceptLanguage('pt;q=0')).toBeNull()
    expect(localeFromAcceptLanguage(null)).toBeNull()
  })
})

describe('resolveLocale', () => {
  it('honours the language the person chose above everything', () => {
    expect(resolveLocale({ chosen: 'en-GB', country: 'BR', acceptLanguage: 'pt-BR' })).toBe('en-GB')
  })

  it('uses the country of the connection before the browser language', () => {
    expect(resolveLocale({ chosen: null, country: 'PT', acceptLanguage: 'en-US' })).toBe('pt-PT')
    expect(resolveLocale({ chosen: 'klingon', country: 'US', acceptLanguage: 'pt-BR' })).toBe(
      'en-US',
    )
  })

  it('falls back to the browser and then to American English', () => {
    expect(resolveLocale({ chosen: null, country: 'XX1', acceptLanguage: 'pt-PT' })).toBe('pt-PT')
    expect(resolveLocale({ chosen: null, country: null, acceptLanguage: 'ja' })).toBe('en-US')
  })

  it('recognises only the supported locales', () => {
    expect(isLocale('pt-BR')).toBe(true)
    expect(isLocale('pt')).toBe(false)
  })
})
