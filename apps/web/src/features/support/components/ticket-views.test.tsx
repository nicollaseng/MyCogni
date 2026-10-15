import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { closedTicket, pendingTicket } from '../test-data'
import { timelineSteps } from './status-timeline'
import { TicketDetail } from './ticket-detail'
import { TicketList } from './ticket-list'
import { TicketTable } from './ticket-table'

const timeZone = 'America/Sao_Paulo'

describe('TicketList', () => {
  it('lists the tickets of the person with subject, status and number', () => {
    renderWithIntl(<TicketList tickets={[pendingTicket, closedTicket]} timeZone={timeZone} />)

    const items = within(screen.getByRole('list', { name: 'Meus chamados' })).getAllByRole('link')
    expect(items[0]).toHaveAttribute('href', `/support/${pendingTicket.id}`)
    expect(items[0]).toHaveTextContent('Problema técnico')
    expect(items[0]).toHaveTextContent('Pendente')
    expect(items[0]).toHaveTextContent('#1042')
    expect(items[1]).toHaveTextContent('Exportar dados')
    expect(items[1]).toHaveTextContent('Fechado')
  })

  it('says when no ticket was opened yet', () => {
    renderWithIntl(<TicketList tickets={[]} timeZone={timeZone} />)

    expect(screen.getByText('Você ainda não abriu nenhum chamado.')).toBeInTheDocument()
  })
})

describe('TicketTable', () => {
  it('shows the tickets of a professional in a table that opens each one', () => {
    renderWithIntl(<TicketTable tickets={[pendingTicket]} timeZone={timeZone} />)

    const table = within(screen.getByRole('table', { name: 'Meus chamados' }))
    expect(table.getByRole('link', { name: 'Abrir chamado #1042' })).toHaveAttribute(
      'href',
      `/pro/support/${pendingTicket.id}`,
    )
    expect(table.getByText('Problema técnico')).toBeInTheDocument()
    expect(table.getByText('Pendente')).toBeInTheDocument()
  })

  it('says when no ticket was opened yet', () => {
    renderWithIntl(<TicketTable tickets={[]} timeZone={timeZone} />)

    expect(screen.getByText('Você ainda não abriu nenhum chamado.')).toBeInTheDocument()
  })
})

describe('TicketDetail', () => {
  it('follows the ticket from pending, waiting for the next steps', () => {
    renderWithIntl(<TicketDetail ticket={pendingTicket} timeZone={timeZone} />)

    const steps = within(screen.getByRole('list', { name: 'Andamento' })).getAllByRole('listitem')
    expect(steps.map((step) => step.textContent)).toEqual([
      expect.stringContaining('Pendente'),
      expect.stringContaining('Em andamentoAinda não'),
      expect.stringContaining('FechadoAinda não'),
    ])
    expect(steps[0]).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText(pendingTicket.message)).toBeInTheDocument()
    expect(screen.getByText('tela.png')).toBeInTheDocument()
  })

  it('shows the note of the team once the ticket is closed', () => {
    renderWithIntl(
      <TicketDetail
        ticket={{ ...closedTicket, takenAt: '2026-10-13T10:00:00Z' }}
        timeZone={timeZone}
      />,
    )

    const steps = within(screen.getByRole('list', { name: 'Andamento' })).getAllByRole('listitem')
    expect(steps[2]).toHaveAttribute('aria-current', 'step')
    expect(steps[2]).toHaveTextContent('Chamado encerrado')
    expect(screen.getByRole('region', { name: 'Mensagem da equipe' })).toHaveTextContent(
      'Enviamos o arquivo por email.',
    )
  })

  it('leaves out the in progress step of a ticket closed straight away', () => {
    expect(timelineSteps(closedTicket).map((step) => step.status)).toEqual(['pending', 'closed'])
    expect(timelineSteps(pendingTicket).map((step) => step.status)).toEqual([
      'pending',
      'in_progress',
      'closed',
    ])
  })
})
