import { describe, expect, it } from '@jest/globals'
import type { CareLink } from '@mycogni/contracts'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { TermsNotice } from './terms-notice'

function link(id: string, termsOutdated: boolean): CareLink {
  return {
    id,
    professional: {
      name: 'Helena Prado',
      kind: 'psychologist',
      registration: null,
      photoUrl: null,
      emergencyWhatsapp: null,
    },
    sharesHistory: false,
    startedAt: '2026-10-01T15:00:00.000Z',
    consentVersion: termsOutdated ? '2026-10' : '2026-10-15',
    termsOutdated,
  }
}

describe('TermsNotice', () => {
  it('stays quiet while every link is on the current terms', () => {
    const { container } = renderWithIntl(<TermsNotice links={[link('a', false)]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('asks to review the updated terms of the link that waits for them', () => {
    renderWithIntl(<TermsNotice links={[link('a', false), link('b', true)]} />)

    expect(
      screen.getByText(/Atualizamos os termos de compartilhamento\./).closest('p'),
    ).toHaveTextContent('Atualizamos os termos de compartilhamento. Revise e confirme.')
    expect(screen.getByRole('link', { name: 'Revise e confirme' })).toHaveAttribute(
      'href',
      '/me/professionals/b/terms',
    )
  })

  it('sends to the professionals list when several links wait for the terms', () => {
    renderWithIntl(<TermsNotice links={[link('a', true), link('b', true)]} />, {
      locale: 'en-US',
    })

    expect(screen.getByRole('link', { name: 'Review and confirm' })).toHaveAttribute(
      'href',
      '/me#professionals',
    )
  })
})
