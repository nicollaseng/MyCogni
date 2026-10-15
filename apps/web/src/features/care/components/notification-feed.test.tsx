import { describe, expect, it, jest } from '@jest/globals'
import type { Notification } from '@mycogni/contracts'
import { screen, waitFor } from '@testing-library/react'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { NotificationFeed } from './notification-feed'

type MarkRead = (ids: string[]) => Promise<ActionResult<null>>

const invitationId = '7a1c2b3d-0000-4000-8000-000000000010'

const notifications: Notification[] = [
  {
    id: '7a1c2b3d-0000-4000-8000-000000000001',
    kind: 'invitation',
    createdAt: '2026-10-14T15:00:00.000Z',
    readAt: null,
    invitation: {
      id: invitationId,
      status: 'pending',
      professional: { name: 'Helena Prado', kind: 'psychologist' },
    },
  },
  {
    id: '7a1c2b3d-0000-4000-8000-000000000002',
    kind: 'marketing',
    createdAt: '2026-10-01T15:00:00.000Z',
    readAt: '2026-10-02T15:00:00.000Z',
    invitation: null,
  },
]

function markRead(): Promise<ActionResult<null>> {
  return Promise.resolve({ ok: true, value: null })
}

describe('NotificationFeed', () => {
  it('writes each notification in the language of the person', () => {
    renderWithIntl(
      <NotificationFeed
        notifications={notifications}
        timeZone="America/New_York"
        markRead={markRead}
      />,
      { locale: 'en-US' },
    )

    const [invitation, news] = screen.getAllByRole('listitem')
    expect(invitation).toHaveTextContent('NewOctober 14')
    expect(invitation).toHaveTextContent(
      'Helena Prado sent you an invitation to follow your entries.',
    )
    expect(invitation).toHaveTextContent('Psychology · Waiting for your answer')
    expect(screen.getByRole('link', { name: 'View invitation' })).toHaveAttribute(
      'href',
      `/invites/${invitationId}`,
    )
    expect(news).toHaveTextContent('News from MyCogniAI')
    expect(screen.getAllByText('New')).toHaveLength(1)
  })

  it('uses the Portuguese text by default', () => {
    renderWithIntl(
      <NotificationFeed
        notifications={notifications}
        timeZone="America/Sao_Paulo"
        markRead={markRead}
      />,
    )

    expect(
      screen.getByText('Helena Prado convidou você para acompanhar seus registros.'),
    ).toBeInTheDocument()
  })

  it('marks only the unread notifications as read once it is opened', async () => {
    const read = jest.fn<MarkRead>(markRead)
    renderWithIntl(
      <NotificationFeed
        notifications={notifications}
        timeZone="America/Sao_Paulo"
        markRead={read}
      />,
    )

    await waitFor(() => {
      expect(read).toHaveBeenCalledWith(['7a1c2b3d-0000-4000-8000-000000000001'])
    })
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('does not call the server when everything was already read', () => {
    const read = jest.fn<MarkRead>(markRead)
    renderWithIntl(
      <NotificationFeed notifications={[]} timeZone="America/Sao_Paulo" markRead={read} />,
    )

    expect(screen.getByText('Nada por aqui por enquanto.')).toBeInTheDocument()
    expect(read).not.toHaveBeenCalled()
  })
})
