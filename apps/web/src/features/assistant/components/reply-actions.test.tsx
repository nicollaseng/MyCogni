import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { ReplyActions } from './reply-actions'

describe('ReplyActions', () => {
  it('turns each catalog action into a small labelled control', () => {
    renderWithIntl(
      <ReplyActions
        actions={[
          { type: 'article', id: 'worry-time' },
          { type: 'track', id: 'sleep-and-rest' },
          { type: 'check_in' },
          { type: 'mybook' },
        ]}
        onLeave={jest.fn()}
      />,
    )

    const group = screen.getByRole('group', { name: 'Sugestões do Cogni' })
    expect(
      within(group)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Ler: A hora da preocupação', '/zen/articles/worry-time'],
      [expect.stringMatching(/^Trilha: /), '/zen/tracks/sleep-and-rest'],
      ['Fazer um check-in', '/check-in'],
      ['Escrever no MyBook', '/mybook'],
    ])
  })

  it('closes the chat when a link leaves it', async () => {
    const onLeave = jest.fn()
    renderWithIntl(<ReplyActions actions={[{ type: 'check_in' }]} onLeave={onLeave} />)

    await userEvent.click(screen.getByRole('link', { name: 'Fazer um check-in' }))

    expect(onLeave).toHaveBeenCalled()
  })

  it('opens the breathing mode on top and keeps Escape from reaching the chat', async () => {
    const onKeyDown = jest.fn()
    renderWithIntl(
      <div onKeyDown={onKeyDown}>
        <ReplyActions actions={[{ type: 'breathe' }]} onLeave={jest.fn()} />
      </div>,
      { locale: 'en-US' },
    )

    await userEvent.click(screen.getByRole('button', { name: 'Breathe for 1 minute' }))
    expect(screen.getByRole('dialog', { name: 'Box breathing' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(onKeyDown).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Breathe for 1 minute' })).toHaveFocus()
  })
})
