import { describe, expect, it, jest } from '@jest/globals'
import type { Consent } from '@mycogni/contracts'
import { screen } from '@testing-library/react'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { ConsentList } from './consent-list'

const consents: Consent[] = [
  { kind: 'terms', version: '2026-10-01', grantedAt: '2026-10-01T13:00:00Z' },
  { kind: 'privacy', version: '2026-10-01', grantedAt: '2026-10-01T13:00:00Z' },
]

function setAiConsent(): Promise<ActionResult<string>> {
  return Promise.resolve({ ok: true, value: 'ok' })
}

describe('ConsentList', () => {
  it('names each consent, links the documents and says when it was given', () => {
    renderWithIntl(
      <ConsentList consents={consents} timeZone="America/Sao_Paulo" setAiConsent={setAiConsent} />,
    )

    const [terms, , health] = screen.getAllByRole('listitem')
    expect(screen.getByRole('link', { name: 'Termos de uso' })).toHaveAttribute('href', '/terms')
    expect(terms).toHaveTextContent('Autorizado em quinta-feira, 1 de outubro')
    expect(health).toHaveTextContent('Uso dos seus dados de saúdeNão autorizado')
    expect(screen.getByRole('switch', { name: 'Resumos escritos por IA' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('speaks English with the date written the American way', () => {
    renderWithIntl(
      <ConsentList
        consents={[
          ...consents,
          { kind: 'ai_processing', version: '2026-10-01', grantedAt: '2026-10-01T13:00:00Z' },
        ]}
        timeZone="America/New_York"
        setAiConsent={jest.fn(setAiConsent)}
      />,
      { locale: 'en-US' },
    )

    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy')
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Granted on Thursday, October 1')
    expect(screen.getByText('Confirmation that you are 18 or older')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'AI-written summaries' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })
})
