import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { exchange, fakeActions, message, overview } from '../test-data'
import { PageAssistant } from './page-assistant'

const entryId = '8a7d3c1e-0000-4000-8000-000000000001'

function renderPage(records = true) {
  const steps: string[] = []
  const actions = fakeActions({ overview: overview(records), contacts: [] })
  actions.send.mockImplementation(() => {
    steps.push('send')
    return Promise.resolve({
      ok: true,
      value: exchange('Resuma esta página', message('assistant', 'Sua página fala do parque.')),
    })
  })
  const prepare = jest.fn(() => {
    steps.push('flush')
    return Promise.resolve(true)
  })
  const user = userEvent.setup()
  renderWithIntl(
    <PageAssistant
      entryId={entryId}
      actions={actions}
      timeZone="America/Sao_Paulo"
      prepare={prepare}
    />,
  )
  return { actions, prepare, steps, user }
}

describe('PageAssistant', () => {
  it('opens the chat about this page with three suggestions', async () => {
    const { user } = renderPage()

    await user.click(screen.getByRole('button', { name: 'Conversar com o Cogni' }))

    const chat = screen.getByRole('dialog', { name: 'Cogni' })
    expect(await within(chat).findByText('Sobre esta página')).toBeVisible()
    const suggestions = within(chat).getByRole('list', { name: 'Sugestões para esta página' })
    expect(
      within(suggestions)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual([
      'Me ajude a continuar',
      'O que este texto diz sobre como estou?',
      'Resuma esta página',
    ])
    expect(within(chat).queryByText('Como foi meu humor nas últimas duas semanas?')).toBeNull()
  })

  it('saves what is being written before asking, and asks about this page', async () => {
    const { actions, steps, user } = renderPage()

    await user.click(screen.getByRole('button', { name: 'Conversar com o Cogni' }))
    await user.click(await screen.findByRole('button', { name: 'Resuma esta página' }))

    expect(await screen.findByText('Sua página fala do parque.')).toBeVisible()
    expect(steps).toEqual(['flush', 'send'])
    expect(actions.send).toHaveBeenCalledWith(
      { mode: 'personal', entryId },
      null,
      'Resuma esta página',
    )
    expect(screen.getByText('Sobre esta página')).toBeVisible()
    expect(screen.getByRole('dialog', { name: 'Resuma esta página' })).toBeInTheDocument()
  })

  it('suggests reading MyBook when asking for permission on a page', async () => {
    const { user } = renderPage(false)

    await user.click(screen.getByRole('button', { name: 'Conversar com o Cogni' }))

    expect(await screen.findByRole('checkbox', { name: 'Ler também o MyBook' })).toBeChecked()
  })
})
