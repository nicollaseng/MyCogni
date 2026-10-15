import { describe, expect, it, jest } from '@jest/globals'
import type { AdminSupportTicket } from '@mycogni/contracts'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { adminTicket, pendingTicket } from '@/features/support/test-data'
import { renderWithIntl } from '@/test/render'
import type { ChangeTicketStatus } from '../support'
import { SupportActions } from './support-actions'

const requester = { name: 'Ana Souza', email: 'ana@exemplo.com' }

function renderActions(
  status: AdminSupportTicket['status'],
  outcome?: Awaited<ReturnType<ChangeTicketStatus>>,
) {
  const change = jest.fn<ChangeTicketStatus>((_id, input) =>
    Promise.resolve(
      outcome ?? {
        ok: true,
        value: adminTicket({ ...pendingTicket, status: input.status }, requester),
      },
    ),
  )
  const user = userEvent.setup()
  renderWithIntl(
    <SupportActions ticket={{ id: pendingTicket.id, number: 1042, status }} change={change} />,
  )
  return { change, user }
}

describe('SupportActions', () => {
  it('takes a pending ticket and tells that the person was told', async () => {
    const { change, user } = renderActions('pending')

    await user.click(screen.getByRole('button', { name: 'Assumir' }))

    expect(change).toHaveBeenCalledWith(pendingTicket.id, { status: 'in_progress' })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Chamado #1042 em andamento. A pessoa foi avisada.',
    )
  })

  it('closes with an optional note to the person', async () => {
    const { change, user } = renderActions('in_progress')

    expect(screen.queryByRole('button', { name: 'Assumir' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fechar chamado' }))
    const note = screen.getByLabelText('Mensagem para a pessoa (opcional)')
    expect(note).toHaveFocus()
    await user.type(note, '  Trocamos o email da conta.  ')
    await user.click(screen.getByRole('button', { name: 'Confirmar fechamento' }))

    expect(change).toHaveBeenCalledWith(pendingTicket.id, {
      status: 'closed',
      note: 'Trocamos o email da conta.',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Chamado #1042 fechado. A pessoa foi avisada.',
    )
  })

  it('closes without a note and can give up closing', async () => {
    const { change, user } = renderActions('pending')

    await user.click(screen.getByRole('button', { name: 'Fechar chamado' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByLabelText('Mensagem para a pessoa (opcional)')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar chamado' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar fechamento' }))

    expect(change).toHaveBeenCalledWith(pendingTicket.id, { status: 'closed' })
  })

  it('offers nothing on a closed ticket', () => {
    renderActions('closed')

    expect(screen.getByText('Este chamado está fechado.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('tells the team when the change was not saved', async () => {
    const { user } = renderActions('pending', { ok: false, error: 'Não conseguimos atualizar.' })

    await user.click(screen.getByRole('button', { name: 'Assumir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos atualizar.')
  })
})
