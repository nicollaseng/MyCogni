import { describe, expect, it } from '@jest/globals'
import type { ReceivedInvitation } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { InvitationList } from './invitation-list'

function invitation(
  id: string,
  name: string,
  overrides: Partial<ReceivedInvitation> = {},
): ReceivedInvitation {
  return {
    id,
    professional: { name, kind: 'psychologist', registration: 'CRP 06/123456' },
    status: 'pending',
    createdAt: '2026-10-14T15:00:00.000Z',
    expiresAt: '2026-10-17T15:00:00.000Z',
    respondedAt: null,
    ...overrides,
  }
}

describe('InvitationList', () => {
  it('groups the invitations by status with the pending ones first', () => {
    renderWithIntl(
      <InvitationList
        timeZone="America/Sao_Paulo"
        invitations={[
          invitation('5d0f4c1e-0000-4000-8000-000000000001', 'Rafael Costa', {
            status: 'declined',
            respondedAt: '2026-10-13T15:00:00.000Z',
          }),
          invitation('5d0f4c1e-0000-4000-8000-000000000002', 'Helena Prado'),
          invitation('5d0f4c1e-0000-4000-8000-000000000003', 'Lúcia Mendes', {
            professional: { name: 'Lúcia Mendes', kind: 'psychiatrist', registration: null },
            status: 'accepted',
            respondedAt: '2026-10-12T15:00:00.000Z',
          }),
        ]}
      />,
    )

    expect(screen.getAllByRole('region').map((group) => group.getAttribute('aria-label'))).toEqual([
      'Aguardando sua resposta',
      'Aceitos',
      'Recusados',
    ])

    const pending = within(screen.getByRole('region', { name: 'Aguardando sua resposta' }))
    const answer = pending.getByRole('link', { name: /Helena Prado/ })
    expect(answer).toHaveAttribute('href', '/invites/5d0f4c1e-0000-4000-8000-000000000002')
    expect(answer).toHaveTextContent('Psicologia · Recebido em 14 de outubro')

    const accepted = screen.getByRole('region', { name: 'Aceitos' })
    expect(accepted).toHaveTextContent('Psiquiatria · Aceito em 12 de outubro')
    expect(within(accepted).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Recusados' })).toHaveTextContent('Rafael Costa')
  })

  it('says when nothing arrived yet', () => {
    renderWithIntl(<InvitationList invitations={[]} timeZone="America/Sao_Paulo" />)

    expect(screen.getByText(/Você ainda não recebeu convites/)).toBeInTheDocument()
  })
})
