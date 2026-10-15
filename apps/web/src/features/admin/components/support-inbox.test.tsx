import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { adminTicket, closedTicket, pendingTicket } from '@/features/support/test-data'
import { renderWithIntl } from '@/test/render'
import { SupportInbox } from './support-inbox'

const ana = adminTicket(pendingTicket, { name: 'Ana Souza', email: 'ana@exemplo.com' })
const helena = adminTicket(
  {
    ...pendingTicket,
    id: '0b7c6c8e-6a8f-4f53-9f4b-000000000063',
    number: 1044,
    subject: 'professional',
    role: 'professional',
    createdAt: '2026-10-12T08:00:00Z',
  },
  { name: 'Helena Prado', email: 'helena@exemplo.com' },
)

function numbers(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.getAttribute('aria-label') ?? '')
}

describe('SupportInbox', () => {
  it('lists who opened each ticket, as what, and since when', () => {
    renderWithIntl(<SupportInbox tickets={[ana, helena]} status="pending" timeZone="UTC" />)

    const row = within(screen.getByRole('row', { name: '#1042' }))
    expect(row.getByRole('link', { name: '#1042' })).toHaveAttribute(
      'href',
      `/admin/support/${ana.id}`,
    )
    expect(row.getByText('Problema técnico')).toBeInTheDocument()
    expect(row.getByText('Ana Souza')).toBeInTheDocument()
    expect(row.getByText('ana@exemplo.com')).toBeInTheDocument()
    expect(row.getByText('Paciente')).toBeInTheDocument()
    expect(row.getByText('Pendente')).toBeInTheDocument()
    expect(
      within(screen.getByRole('row', { name: '#1044' })).getByText('Profissional'),
    ).toBeVisible()
  })

  it('shows the oldest waiting ticket first and sorts by number on demand', async () => {
    const user = userEvent.setup()
    renderWithIntl(<SupportInbox tickets={[ana, helena]} status="pending" timeZone="UTC" />)

    expect(numbers()).toEqual(['#1044', '#1042'])

    await user.click(screen.getByRole('button', { name: 'Número' }))
    expect(numbers()).toEqual(['#1042', '#1044'])
    expect(screen.getByRole('columnheader', { name: 'Número' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )

    await user.click(screen.getByRole('button', { name: 'Número' }))
    expect(numbers()).toEqual(['#1044', '#1042'])
  })

  it('searches by person and says when nothing matches', async () => {
    const user = userEvent.setup()
    renderWithIntl(<SupportInbox tickets={[ana, helena]} status="pending" timeZone="UTC" />)

    await user.type(screen.getByRole('searchbox', { name: 'Buscar chamados' }), 'helena')
    expect(numbers()).toEqual(['#1044'])

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar chamados' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar chamados' }), 'ninguém')
    expect(screen.getByText('Nenhum chamado encontrado.')).toBeInTheDocument()
  })

  it('says when a tab has no tickets', () => {
    renderWithIntl(<SupportInbox tickets={[]} status="in_progress" timeZone="UTC" />)

    expect(screen.getByText('Nenhum chamado em andamento.')).toBeInTheDocument()
  })

  it('reads the closed tab too', () => {
    renderWithIntl(
      <SupportInbox
        tickets={[adminTicket(closedTicket, { name: null, email: null })]}
        status="closed"
        timeZone="UTC"
      />,
    )

    const row = within(screen.getByRole('row', { name: '#1043' }))
    expect(row.getByText('Sem nome')).toBeInTheDocument()
    expect(row.getByText('Exportar dados')).toBeInTheDocument()
    expect(row.getByText('Fechado')).toBeInTheDocument()
  })
})
