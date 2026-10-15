import { describe, expect, it, jest } from '@jest/globals'
import type { Notification, NotificationList } from '@mycogni/contracts'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { NotificationHref } from '../notification-href'
import { NotificationPopover } from './notification-popover'

type MarkRead = (ids: string[]) => Promise<ActionResult<null>>

type Latest = () => Promise<ActionResult<NotificationList>>

const pending: Latest = () => new Promise(() => undefined)

const invitationId = '7a1c2b3d-0000-4000-8000-000000000010'
const insightId = '7a1c2b3d-0000-4000-8000-000000000020'
const minute = 60 * 1000

function ago(milliseconds: number): string {
  return new Date(Date.now() - milliseconds).toISOString()
}

const notifications: Notification[] = [
  {
    id: '7a1c2b3d-0000-4000-8000-000000000001',
    kind: 'invitation',
    createdAt: ago(5 * minute),
    readAt: null,
    insightId: null,
    supportTicket: null,
    invitation: {
      id: invitationId,
      status: 'pending',
      professional: { name: 'Helena Prado', kind: 'psychologist' },
    },
  },
  {
    id: '7a1c2b3d-0000-4000-8000-000000000002',
    kind: 'insight',
    createdAt: ago(3 * 60 * minute),
    readAt: null,
    insightId,
    supportTicket: null,
    invitation: null,
  },
  {
    id: '7a1c2b3d-0000-4000-8000-000000000003',
    kind: 'system',
    createdAt: ago(2 * 24 * 60 * minute),
    readAt: ago(24 * 60 * minute),
    insightId: null,
    supportTicket: null,
    invitation: null,
  },
]

function renderPopover(
  items: readonly Notification[] = notifications,
  unread = 2,
  latest: Latest = pending,
) {
  const markRead = jest.fn<MarkRead>(() => Promise.resolve({ ok: true, value: null }))
  const navigate = jest.fn<(href: NotificationHref) => void>()
  const user = userEvent.setup()
  renderWithIntl(
    <>
      <NotificationPopover
        notifications={items}
        unread={unread}
        timeZone="America/Sao_Paulo"
        markRead={markRead}
        latest={latest}
        navigate={navigate}
      />
      <p>Fora do aviso</p>
    </>,
  )
  return { user, markRead, navigate }
}

function bell(): HTMLElement {
  return screen.getByRole('button', { name: /^Notificações/ })
}

describe('NotificationPopover', () => {
  it('opens from the bell instead of leaving the page', async () => {
    const { user, navigate } = renderPopover()

    expect(bell()).toHaveAccessibleName('Notificações, 2 não lidas')
    expect(bell()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: /Notificações/ })).not.toBeInTheDocument()

    await user.click(bell())

    expect(bell()).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(bell().getAttribute('aria-controls') ?? '')).toHaveTextContent(
      '2 não lidas',
    )
    expect(navigate).not.toHaveBeenCalled()
  })

  it('lists the latest notifications with what is unread and when it arrived', async () => {
    const { user } = renderPopover()

    await user.click(bell())

    const menu = screen.getByRole('menu', { name: 'Notificações' })
    const items = within(menu).getAllByRole('menuitem')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent(
      'Nova: Helena Prado convidou você para acompanhar seus registros.há 5 minutos',
    )
    expect(items[1]).toHaveTextContent('Nova: Seu resumo da semana está pronto.há 3 horas')
    expect(items[2]).toHaveTextContent('Aviso do MyCogniAIanteontem')
    expect(items[2]).not.toHaveTextContent('Nova')
    expect(items[3]).toHaveTextContent('Ver todas')
    expect(items[3]).toHaveAttribute('href', '/notifications')
    expect(items[0]).toHaveFocus()
  })

  it('brings what arrived after the page loaded as soon as the bell opens', async () => {
    const older = notifications.slice(2)
    const latest = jest.fn<Latest>(() =>
      Promise.resolve({ ok: true, value: { items: notifications.slice(1), unread: 1 } }),
    )
    const { user } = renderPopover(older, 0, latest)

    expect(bell()).toHaveAccessibleName('Notificações')
    await user.click(bell())

    expect(await screen.findByRole('menuitem', { name: /resumo da semana/ })).toBeVisible()
    expect(bell()).toHaveAccessibleName('Notificações, 1 não lida')
    expect(latest).toHaveBeenCalledTimes(1)
  })

  it('marks a notification as read, updates the count and then opens its page', async () => {
    const { user, markRead, navigate } = renderPopover()

    await user.click(bell())
    await user.click(screen.getByRole('menuitem', { name: /Helena Prado/ }))

    expect(markRead).toHaveBeenCalledWith(['7a1c2b3d-0000-4000-8000-000000000001'])
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(`/invites/${invitationId}`)
    })
    expect(bell()).toHaveAccessibleName('Notificações, 1 não lida')
    expect(bell()).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the reading of a weekly summary on Padrões', async () => {
    const { user, navigate } = renderPopover()

    await user.click(bell())
    await user.click(screen.getByRole('menuitem', { name: /resumo da semana/ }))

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(`/patterns#reading-${insightId}`)
    })
  })

  it('goes straight to the page of a notification that was already read', async () => {
    const { user, markRead, navigate } = renderPopover()

    await user.click(bell())
    await user.click(screen.getByRole('menuitem', { name: /Aviso do MyCogniAI/ }))

    expect(navigate).toHaveBeenCalledWith('/notifications')
    expect(markRead).not.toHaveBeenCalled()
    expect(bell()).toHaveAccessibleName('Notificações, 2 não lidas')
  })

  it('says when there is nothing yet', async () => {
    const { user } = renderPopover([], 0)

    expect(bell()).toHaveAccessibleName('Notificações')
    await user.click(bell())

    expect(screen.getByText('Nada por aqui por enquanto.')).toBeVisible()
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    expect(document.getElementById(bell().getAttribute('aria-controls') ?? '')).toHaveFocus()
  })

  it('closes with Escape and gives the focus back to the bell', async () => {
    const { user } = renderPopover()

    await user.click(bell())
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: /resumo da semana/ })).toHaveFocus()
    await user.keyboard('{Escape}')

    expect(bell()).toHaveAttribute('aria-expanded', 'false')
    expect(bell()).toHaveFocus()
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('closes when clicking elsewhere', async () => {
    const { user } = renderPopover()

    await user.click(bell())
    await user.click(screen.getByText('Fora do aviso'))

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('speaks the language of the person', async () => {
    const markRead = jest.fn<MarkRead>(() => Promise.resolve({ ok: true, value: null }))
    const user = userEvent.setup()
    renderWithIntl(
      <NotificationPopover
        notifications={notifications}
        unread={2}
        timeZone="Europe/London"
        markRead={markRead}
        latest={pending}
        navigate={jest.fn<(href: NotificationHref) => void>()}
      />,
      { locale: 'en-GB' },
    )

    await user.click(screen.getByRole('button', { name: 'Notifications, 2 unread' }))

    expect(screen.getByRole('menuitem', { name: 'See all' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Helena Prado/ })).toHaveTextContent(
      'Helena Prado sent you an invitation to follow your entries.5 minutes ago',
    )
  })
})
