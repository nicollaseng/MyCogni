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

    expect(screen.getByRole('button', { name: 'Perguntar' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
  })

  it.each([
    '/today',
    '/mybook/0f6a3c1e-8b2d-4e5f-9a7b-1c2d3e4f5a6b',
    '/mybook/sharing',
    '/zen',
    '/me',
  ])('stays out of the way on %s', (pathname) => {
    renderAt(pathname)

    expect(screen.queryByRole('button', { name: 'Perguntar' })).not.toBeInTheDocument()
  })

  it('opens the chat in a dialog for the person', async () => {
    const actions = renderAt('/patterns')

    await userEvent.click(screen.getByRole('button', { name: 'Perguntar' }))

    expect(screen.getByRole('dialog', { name: 'Perguntar' })).toBeInTheDocument()
    expect(await screen.findByText('Não substitui um profissional.')).toBeInTheDocument()
    expect(actions.open).toHaveBeenCalledWith({ mode: 'personal' })
  })
})
