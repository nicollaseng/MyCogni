import { describe, expect, it, jest } from '@jest/globals'
import type { CareLink, ConfirmSharingTermsInput } from '@mycogni/contracts'
import { sharingConsentVersion } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { LinkedProfessional } from './linked-professional'
import { SharingTerms } from './sharing-terms'
import { TermsReview } from './terms-review'

type Confirm = (input: ConfirmSharingTermsInput) => Promise<ActionResult<null>>
type End = (id: string) => Promise<ActionResult<null>>

const link: CareLink = {
  id: '3e2d1c0b-0000-4000-8000-000000000001',
  professional: {
    name: 'Helena Prado',
    kind: 'psychologist',
    registration: 'CRP 06/123456',
    photoUrl: 'https://exemplo.com/helena.jpg',
    emergencyWhatsapp: null,
  },
  sharesHistory: false,
  startedAt: '2026-10-14T15:00:00.000Z',
  consentVersion: '2026-10',
  termsOutdated: true,
}

function succeed(): Promise<ActionResult<null>> {
  return Promise.resolve({ ok: true, value: null })
}

function renderReview(confirm: Confirm = succeed, end: End = succeed) {
  return renderWithIntl(
    <>
      <LinkedProfessional link={link} timeZone="America/Sao_Paulo" />
      <SharingTerms name="Helena Prado" action="confirm" />
      <TermsReview id={link.id} name="Helena Prado" confirm={confirm} end={end} />
    </>,
  )
}

describe('TermsReview', () => {
  it('shows who follows the records and the new version of the terms', () => {
    renderReview()

    expect(screen.getByRole('img', { name: 'Foto de Helena Prado' })).toHaveAttribute(
      'src',
      'https://exemplo.com/helena.jpg',
    )
    expect(screen.getByText('Psicologia · Desde 14 de outubro')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Termos de compartilhamento' })).toHaveTextContent(
      `Versão ${sharingConsentVersion}`,
    )
    expect(screen.getByText(/em Perfil e configurações\./)).toBeInTheDocument()
    expect(screen.getByText('Confirmar significa concordar com estes termos.')).toBeInTheDocument()
  })

  it('confirms the version shown on the page', async () => {
    const confirm = jest.fn<Confirm>(succeed)
    renderReview(confirm)

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(confirm).toHaveBeenCalledWith({ consentVersion: sharingConsentVersion })
  })

  it('says when the terms could not be confirmed', async () => {
    renderReview(() => Promise.resolve({ ok: false, error: 'Este vínculo já foi encerrado.' }))

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este vínculo já foi encerrado.')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeEnabled()
  })

  it('ends the link instead, after the same confirmation as in the settings', async () => {
    const end = jest.fn<End>(succeed)
    renderReview(succeed, end)

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar vínculo' }))
    expect(screen.getByText(/deixa de ver seus registros a partir de agora/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
    expect(end).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar vínculo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Encerrar vínculo' }))
    expect(end).toHaveBeenCalledWith(link.id)
  })
})
