import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { privacyPolicy, termsOfUse } from '../content'
import { LegalPage } from './legal-page'

describe('LegalPage', () => {
  it('presents the privacy policy section by section', () => {
    render(<LegalPage document={privacyPolicy} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Política de privacidade' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Base legal' })).toBeInTheDocument()
    expect(screen.getByText(/artigo 11 da LGPD/)).toBeInTheDocument()
  })

  it('says the text is still a draft', () => {
    render(<LegalPage document={termsOfUse} />)

    expect(screen.getByText(/Versão preliminar/)).toBeInTheDocument()
  })

  it('reminds that the service is not an emergency line', () => {
    render(<LegalPage document={termsOfUse} />)

    expect(screen.getByText(/ligue para o CVV no 188/)).toBeInTheDocument()
  })
})
