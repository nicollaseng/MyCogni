import { describe, expect, it, jest } from '@jest/globals'
import type { ProfessionalForReview, ReviewProfessionalInput } from '@mycogni/contracts'
import type { ProfessionalStatus } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { ProfessionalReviewList } from './professional-review-list'

const helena: ProfessionalForReview = {
  userId: '0b7c6c8e-6a8f-4f53-9f4b-000000000031',
  kind: 'psychologist',
  fullName: 'Helena Prado',
  registration: 'CRP 06/123456',
  email: 'helena@exemplo.com',
  status: 'pending',
  reviewNote: null,
  createdAt: '2026-10-14T12:00:00Z',
  verifiedAt: null,
  reviewedAt: null,
  document: {
    id: '0b7c6c8e-6a8f-4f53-9f4b-000000000041',
    fileName: 'Carteira CRP.pdf',
    contentType: 'application/pdf',
    sizeBytes: 245_760,
    createdAt: '2026-10-14T12:05:00Z',
  },
}

const rafael: ProfessionalForReview = {
  ...helena,
  userId: '0b7c6c8e-6a8f-4f53-9f4b-000000000032',
  kind: 'psychoanalyst',
  fullName: 'Rafael Lima',
  registration: null,
  email: 'rafael@exemplo.com',
  document: null,
}

function renderList(
  professionals: readonly ProfessionalForReview[],
  status: ProfessionalStatus = 'pending',
) {
  const review = jest.fn<
    (userId: string, input: ReviewProfessionalInput) => Promise<ActionResult<null>>
  >(() => Promise.resolve({ ok: true, value: null }))
  const user = userEvent.setup()
  renderWithIntl(
    <ProfessionalReviewList
      professionals={professionals}
      status={status}
      timeZone="America/Sao_Paulo"
      review={review}
    />,
  )
  return { review, user }
}

describe('ProfessionalReviewList', () => {
  it('shows what the team needs to check before approving', () => {
    renderList([helena, rafael])

    const first = within(screen.getByRole('row', { name: 'Helena Prado' }))
    expect(first.getByText('Psicologia')).toBeInTheDocument()
    expect(first.getByText('CRP 06/123456')).toBeInTheDocument()
    expect(first.getByText('helena@exemplo.com')).toBeInTheDocument()

    const second = within(screen.getByRole('row', { name: 'Rafael Lima' }))
    expect(second.getByText('Psicanálise')).toBeInTheDocument()
    expect(second.getByText('Sem registro')).toBeInTheDocument()
  })

  it('approves a pending professional', async () => {
    const { review, user } = renderList([helena, rafael])

    await user.click(
      within(screen.getByRole('row', { name: 'Helena Prado' })).getByRole('button', {
        name: 'Aprovar',
      }),
    )

    expect(review).toHaveBeenCalledWith(helena.userId, { status: 'verified' })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Cadastro de Helena Prado aprovado.',
    )
  })

  it('rejects a pending professional only with a reason the professional will read', async () => {
    const { review, user } = renderList([helena, rafael])

    await user.click(
      within(screen.getByRole('row', { name: 'Rafael Lima' })).getByRole('button', {
        name: 'Recusar',
      }),
    )
    const reason = screen.getByLabelText('Motivo da recusa para Rafael Lima')
    expect(reason).toHaveFocus()
    await user.type(reason, 'ok')
    await user.click(screen.getByRole('button', { name: 'Confirmar recusa' }))
    expect(screen.getByText('Escreva o motivo, com pelo menos 3 caracteres.')).toBeInTheDocument()
    expect(review).not.toHaveBeenCalled()

    await user.type(reason, ' — envie o certificado do instituto.')
    await user.click(screen.getByRole('button', { name: 'Confirmar recusa' }))

    expect(review).toHaveBeenCalledWith(rafael.userId, {
      status: 'rejected',
      note: 'ok — envie o certificado do instituto.',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Cadastro de Rafael Lima recusado.')
    expect(screen.queryByLabelText('Motivo da recusa para Rafael Lima')).not.toBeInTheDocument()
  })

  it('opens the document in a new tab and waits for it before approving', () => {
    renderList([helena, rafael])

    const first = within(screen.getByRole('row', { name: 'Helena Prado' }))
    const open = first.getByRole('link', { name: 'Abrir comprovante de Helena Prado em nova aba' })
    expect(open).toHaveAttribute('href', `/admin/documents/${helena.document?.id ?? ''}`)
    expect(open).toHaveAttribute('target', '_blank')
    expect(first.getByText('PDF · 240 kB')).toBeInTheDocument()

    const second = within(screen.getByRole('row', { name: 'Rafael Lima' }))
    expect(second.getByText('Aguardando envio')).toBeInTheDocument()
    expect(second.getByRole('button', { name: 'Aprovar' })).toBeDisabled()
  })

  it('shows the reason of a rejection to the team', () => {
    renderList(
      [
        {
          ...helena,
          status: 'rejected',
          reviewNote: 'Documento ilegível.',
          reviewedAt: '2026-10-15T12:00:00Z',
        },
      ],
      'rejected',
    )

    expect(screen.getByText('Motivo: Documento ilegível.')).toBeInTheDocument()
    expect(screen.getByText(/Revisado em/)).toBeInTheDocument()
  })

  it('offers only to reject someone already verified', () => {
    renderList([{ ...helena, status: 'verified', verifiedAt: '2026-10-15T12:00:00Z' }], 'verified')

    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recusar' })).toBeInTheDocument()
  })

  it('says when there is nobody to review', () => {
    renderList([])

    expect(screen.getByText('Nenhum cadastro aguardando verificação.')).toBeInTheDocument()
  })

  it('tells the team when the review could not be saved', async () => {
    const review = jest.fn<
      (userId: string, input: ReviewProfessionalInput) => Promise<ActionResult<null>>
    >(() => Promise.resolve({ ok: false, error: 'Não conseguimos salvar a revisão agora.' }))
    const user = userEvent.setup()
    renderWithIntl(
      <ProfessionalReviewList
        professionals={[helena]}
        status="pending"
        timeZone="America/Sao_Paulo"
        review={review}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Aprovar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos salvar a revisão agora.',
    )
  })
})
