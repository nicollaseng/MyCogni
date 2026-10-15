import { describe, expect, it, jest } from '@jest/globals'
import type { Locale } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { PrivacyPolicy } from './privacy-policy'
import { TermsOfUse } from './terms-of-use'

function chooseLocale() {
  return jest.fn<(locale: Locale) => Promise<void>>()
}

describe('LegalPage', () => {
  it('presents the privacy policy section by section', () => {
    renderWithIntl(<PrivacyPolicy chooseLocale={chooseLocale()} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Política de privacidade' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Base legal' })).toBeInTheDocument()
    expect(screen.getByText(/artigo 11 da LGPD/)).toBeInTheDocument()
  })

  it('says the text is still a draft', () => {
    renderWithIntl(<TermsOfUse chooseLocale={chooseLocale()} />)

    expect(screen.getByText(/Versão preliminar/)).toBeInTheDocument()
  })

  it('reminds that the service is not an emergency line', () => {
    renderWithIntl(<TermsOfUse chooseLocale={chooseLocale()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Termos de uso' })).toBeInTheDocument()
    expect(screen.getByText(/ligue para o CVV no 188/)).toBeInTheDocument()
  })

  it('keeps the Brazilian legal basis when read in English', () => {
    renderWithIntl(<PrivacyPolicy chooseLocale={chooseLocale()} />, { locale: 'en-US' })

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Legal basis' })).toBeInTheDocument()
    expect(screen.getByText(/Article 11 of the LGPD/)).toBeInTheDocument()
    expect(screen.getByText(/Draft version/)).toBeInTheDocument()
  })

  it('points to local crisis lines in European Portuguese', () => {
    renderWithIntl(<TermsOfUse chooseLocale={chooseLocale()} />, { locale: 'pt-PT' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Termos de utilização' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/ligue para o SNS 24 através do 808 24 24 24/)).toBeInTheDocument()
  })
})
