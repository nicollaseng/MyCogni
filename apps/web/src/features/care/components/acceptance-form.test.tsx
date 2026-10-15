import { describe, expect, it, jest } from '@jest/globals'
import type { AcceptInvitationInput } from '@mycogni/contracts'
import { sharingConsentVersion } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { AcceptanceForm } from './acceptance-form'
import { SharingTerms } from './sharing-terms'

type Accept = (input: AcceptInvitationInput) => Promise<ActionResult<null>>
type Decline = () => Promise<ActionResult<null>>

function succeed(): Promise<ActionResult<null>> {
  return Promise.resolve({ ok: true, value: null })
}

function renderForm(accept: Accept = succeed, decline: Decline = succeed) {
  return renderWithIntl(
    <AcceptanceForm professionalName="Helena Prado" accept={accept} decline={decline}>
      <SharingTerms name="Helena Prado" />
    </AcceptanceForm>,
  )
}

describe('AcceptanceForm', () => {
  it('keeps earlier records private unless the person turns the switch on', async () => {
    const accept = jest.fn<Accept>(succeed)
    renderForm(accept)
    const history = screen.getByRole('switch', {
      name: 'Compartilhar também meus registros anteriores',
    })

    expect(history).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(/verá só o que você registrar a partir de hoje/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Aceitar' }))

    expect(accept).toHaveBeenCalledWith({
      sharesHistory: false,
      consentVersion: sharingConsentVersion,
    })
  })

  it('sends the earlier records too when the person chooses so', async () => {
    const accept = jest.fn<Accept>(succeed)
    renderForm(accept)

    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByText(/também verá tudo o que você registrou/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aceitar' }))

    expect(accept).toHaveBeenCalledWith({
      sharesHistory: true,
      consentVersion: sharingConsentVersion,
    })
  })

  it('shows the sharing terms with their version and the privacy policy', () => {
    renderForm()
    const terms = screen.getByRole('region', { name: 'Termos de compartilhamento' })

    expect(terms).toHaveTextContent(`Versão ${sharingConsentVersion}`)
    expect(screen.getByRole('link', { name: 'política de privacidade' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    expect(screen.getByRole('link', { name: 'Decidir depois' })).toHaveAttribute('href', '/invites')
  })

  it('explains when the invitation can no longer be accepted', async () => {
    renderForm(() =>
      Promise.resolve({ ok: false, error: 'Você já compartilha seus registros com Helena Prado.' }),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Aceitar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Você já compartilha seus registros com Helena Prado.',
    )
    expect(screen.getByRole('button', { name: 'Aceitar' })).toBeEnabled()
  })

  it('declines the invitation', async () => {
    const decline = jest.fn<Decline>(succeed)
    renderForm(succeed, decline)

    await userEvent.click(screen.getByRole('button', { name: 'Recusar' }))

    expect(decline).toHaveBeenCalledTimes(1)
  })
})
