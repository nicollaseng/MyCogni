import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { BellLink } from './bell-link'

describe('BellLink', () => {
  it('leads to the notifications and says how many are unread', () => {
    renderWithIntl(<BellLink unread={2} />)

    const bell = screen.getByRole('link', { name: 'Notificações, 2 não lidas' })
    expect(bell).toHaveAttribute('href', '/notifications')
    expect(bell).toHaveTextContent('2')
  })

  it('shows no badge when everything was read', () => {
    renderWithIntl(<BellLink unread={0} />)

    expect(screen.getByRole('link', { name: 'Notificações' }).textContent).toBe('')
  })

  it('keeps the badge short and speaks the language of the person', () => {
    renderWithIntl(<BellLink unread={14} />, { locale: 'en-GB' })

    const bell = screen.getByRole('link', { name: 'Notifications, 14 unread' })
    expect(bell).toHaveTextContent('9+')
  })
})
