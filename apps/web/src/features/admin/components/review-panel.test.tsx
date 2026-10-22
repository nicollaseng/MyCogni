import { describe, expect, it, jest } from '@jest/globals'
import type { ProfessionalReviewDetail, ReviewProfessionalInput } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { reviewDetail } from '../review-test-data'
import { ReviewPanel } from './review-panel'

type Review = (userId: string, input: ReviewProfessionalInput) => Promise<ActionResult<null>>

const items = [
  'O nome confere com o documento.',
  'O registro confere com o documento.',
  'A foto confere com o rosto do documento.',
  /O registro está ativo na consulta pública do CFP/,
] as const

function renderPanel(
  professional: ProfessionalReviewDetail,
  result: ActionResult<null> = { ok: true, value: null },
) {
  const review = jest.fn<Review>(() => Promise.resolve(result))
  const user = userEvent.setup()
  renderWithIntl(<ReviewPanel professional={professional} review={review} />)
  return { review, user }
}

async function tickEverything(user: ReturnType<typeof userEvent.setup>) {
  for (const item of items) {
    await user.click(screen.getByRole('checkbox', { name: item }))
  }
}

describe('ReviewPanel', () => {
  it('approves only after every item on the checklist is ticked', async () => {
    const { review, user } = renderPanel(reviewDetail())
    const approve = screen.getByRole('button', { name: 'Aprovar' })

    expect(approve).toBeDisabled()
    expect(screen.getByText('Marque os itens da lista para aprovar.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'cadastro.cfp.org.br' })).toHaveAttribute(
      'href',
      'https://cadastro.cfp.org.br/',
    )

    await tickEverything(user)
    await user.click(approve)

    expect(review).toHaveBeenCalledWith(reviewDetail().userId, { status: 'verified' })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Cadastro de Helena Prado aprovado.',
    )
  })

  it('points a CRM to the CFM search and a psychoanalyst to the institution', () => {
    renderPanel(reviewDetail({ kind: 'physician', council: 'crm', registration: 'CRM-SP 1234' }))

    expect(screen.getByRole('link', { name: 'portal.cfm.org.br/busca-medicos' })).toHaveAttribute(
      'href',
      'https://portal.cfm.org.br/busca-medicos/',
    )
  })

  it('asks psychoanalysts only what their documents can show', () => {
    renderPanel(reviewDetail({ kind: 'psychoanalyst', council: null, registration: null }))

    expect(
      screen.getByRole('checkbox', {
        name: 'O comprovante é de uma instituição de formação e traz o mesmo nome.',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  })

  it('keeps approval closed without the photo or the document', async () => {
    const { user } = renderPanel(reviewDetail({ hasPhoto: false, photoUrl: null }))

    await tickEverything(user)

    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeDisabled()
    expect(
      screen.getByText('Para aprovar, o cadastro precisa do comprovante e da foto.'),
    ).toBeInTheDocument()
  })

  it('rejects a pending professional with the reason', async () => {
    const { review, user } = renderPanel(reviewDetail())

    await user.click(screen.getByRole('button', { name: 'Recusar' }))
    await user.type(
      screen.getByLabelText('Motivo da recusa para Helena Prado'),
      'Documento ilegível.',
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar recusa' }))

    expect(review).toHaveBeenCalledWith(reviewDetail().userId, {
      status: 'rejected',
      note: 'Documento ilegível.',
    })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('explains what happens before rejecting someone already verified', async () => {
    const verified = reviewDetail({
      status: 'verified',
      verifiedAt: '2026-10-15T12:00:00Z',
      activeLinks: 2,
      pendingInvitations: 1,
    })
    const { review, user } = renderPanel(verified)

    expect(screen.getByRole('button', { name: 'Revalidar' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Recusar' }))
    await user.type(
      screen.getByLabelText('Motivo da recusa para Helena Prado'),
      'Registro cancelado no conselho.',
    )
    await user.click(screen.getByRole('button', { name: 'Confirmar recusa' }))

    const dialog = screen.getByRole('alertdialog', { name: 'Recusar Helena Prado?' })
    expect(dialog).toHaveTextContent('2 vínculos ativos são encerrados')
    expect(dialog).toHaveTextContent('1 convite pendente é cancelado')
    expect(dialog).toHaveTextContent('aviso neutro')
    expect(review).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Recusar e encerrar' }))

    expect(review).toHaveBeenCalledWith(verified.userId, {
      status: 'rejected',
      note: 'Registro cancelado no conselho.',
    })
  })

  it('tells the team when the decision could not be saved', async () => {
    const { user } = renderPanel(reviewDetail(), {
      ok: false,
      error: 'Não conseguimos salvar a revisão agora.',
    })

    await tickEverything(user)
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos salvar a revisão agora.',
    )
  })
})
