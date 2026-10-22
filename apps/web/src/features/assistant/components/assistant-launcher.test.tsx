import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { fakeActions, overview } from '../test-data'
import { AssistantEntry } from './assistant-launcher'

function renderAt(pathname: string) {
  const actions = fakeActions({ overview: overview(true), contacts: [] })
  renderWithIntl(
    <AssistantEntry pathname={pathname} actions={actions} timeZone="America/Sao_Paulo" />,
  )
  return actions
}

describe('AssistantEntry', () => {
  it.each(['/entries', '/mybook', '/patterns'])('offers the button on %s', (pathname) => {
    renderAt(pathname)

    const launcher = screen.getByRole('button', { name: 'Conversar com o Cogni' })
    expect(launcher).toHaveAttribute('aria-haspopup', 'dialog')
    expect(launcher).toHaveTextContent('Conversar')
    expect(launcher.querySelector('svg')).toHaveAttribute('aria-hidden')
  })

  it.each([
    '/today',
    '/mybook/0f6a3c1e-8b2d-4e5f-9a7b-1c2d3e4f5a6b',
    '/mybook/sharing',
    '/zen',
    '/me',
  ])('stays out of the way on %s', (pathname) => {
    renderAt(pathname)

    expect(screen.queryByRole('button', { name: 'Conversar com o Cogni' })).not.toBeInTheDocument()
  })

  it('opens the chat in a dialog for the person', async () => {
    const actions = renderAt('/patterns')

    await userEvent.click(screen.getByRole('button', { name: 'Conversar com o Cogni' }))

    expect(screen.getByRole('dialog', { name: 'Perguntar' })).toBeInTheDocument()
    expect(await screen.findByText('IA pode cometer erros')).toBeInTheDocument()
    expect(
      screen.getByText('MyCogniAI não substitui um aconselhamento de saúde profissional.'),
    ).toBeInTheDocument()
    expect(actions.open).toHaveBeenCalledWith({ mode: 'personal' })
  })

  it('names the launcher in English', () => {
    renderWithIntl(
      <AssistantEntry
        pathname="/entries"
        actions={fakeActions({ overview: overview(true), contacts: [] })}
        timeZone="Europe/London"
      />,
      { locale: 'en-US' },
    )

    expect(screen.getByRole('button', { name: 'Chat with Cogni' })).toHaveTextContent('Chat')
  })
})
