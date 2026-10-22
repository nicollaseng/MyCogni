import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { AssistantConversationSummary } from '@mycogni/contracts'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from '@/shared/components/sheet'
import { renderWithIntl } from '@/test/render'
import type { AssistantState, AssistantTarget } from '../model'
import { exchange, fakeActions, message, overview } from '../test-data'
import { AssistantChat } from './assistant-chat'

const now = new Date('2026-10-22T15:00:00Z')

const personal: AssistantTarget = { mode: 'personal' }

function summary(id: string, preview: string, updatedAt: string): AssistantConversationSummary {
  return {
    id,
    mode: 'personal',
    risk: 'none',
    preview,
    entryId: null,
    createdAt: updatedAt,
    updatedAt,
  }
}

const week = [
  summary('c-today', 'Como dormi esta semana?', '2026-10-22T13:00:00Z'),
  summary('c-yesterday', 'O que me ajudou ontem?', '2026-10-21T18:00:00Z'),
  summary('c-week', 'Por que a segunda foi pesada?', '2026-10-19T12:00:00Z'),
  summary('c-older', 'Como foi setembro?', '2026-09-30T12:00:00Z'),
]

function renderSheet(state: AssistantState, target: AssistantTarget = personal, name?: string) {
  const actions = fakeActions(state)
  const onClosed = jest.fn()
  const user = userEvent.setup()
  renderWithIntl(
    <Sheet bare onClose={onClosed}>
      {(close, titleId) => (
        <AssistantChat
          target={target}
          actions={actions}
          timeZone="America/Sao_Paulo"
          titleId={titleId}
          onClose={close}
          patientName={name}
        />
      )}
    </Sheet>,
  )
  return { actions, onClosed, user }
}

async function openHistory(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Conversas' }))
  return screen.getByRole('dialog', { name: 'Conversas' })
}

describe('AssistantChat header and history', () => {
  beforeEach(() => {
    jest.useFakeTimers({
      now,
      doNotFake: [
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows one header row with icon buttons and the new conversation title', async () => {
    const { onClosed, user } = renderSheet({ overview: overview(true, week), contacts: [] })

    const chat = screen.getByRole('dialog', { name: 'Cogni' })
    const history = await within(chat).findByRole('button', { name: 'Conversas' })
    expect(history).toHaveAttribute('title', 'Conversas')
    expect(history).toHaveClass('size-11', 'border')
    expect(within(chat).getByRole('heading', { level: 2 })).toHaveTextContent('Cogni')
    const fresh = within(chat).getByRole('button', { name: 'Nova conversa' })
    expect(fresh).toHaveAttribute('aria-disabled', 'true')
    expect(fresh).toHaveAttribute('title', 'Nova conversa')
    expect(within(chat).queryByRole('button', { name: 'Apagar' })).toBeNull()
    expect(within(chat).queryByRole('link')).toBeNull()

    await user.click(within(chat).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => {
      expect(onClosed).toHaveBeenCalled()
    })
  })

  it('titles the conversation from the first question, cut at a word', async () => {
    const question = 'Como foi minha semana de trabalho e de sono nos últimos dias?'
    const { actions, user } = renderSheet({ overview: overview(true), contacts: [] })
    actions.send.mockResolvedValue({
      ok: true,
      value: exchange(question, message('assistant', 'Foi mais calma no fim.')),
    })

    await user.type(await screen.findByRole('textbox', { name: 'Mensagem' }), `${question}{Enter}`)

    await screen.findByText('Foi mais calma no fim.')
    expect(
      screen.getByRole('dialog', { name: 'Como foi minha semana de trabalho e de…' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nova conversa' })).not.toHaveAttribute(
      'aria-disabled',
    )
  })

  it('opens the history as its own view grouped by day and opens a conversation', async () => {
    const { actions, user } = renderSheet({ overview: overview(true, week), contacts: [] })
    actions.load.mockResolvedValue({
      ok: true,
      value: {
        ...summary('c-week', 'Por que a segunda foi pesada?', '2026-10-19T12:00:00Z'),
        messages: [
          message('user', 'Por que a segunda foi pesada?'),
          message('assistant', 'Teve pouco sono.'),
        ],
      },
    })

    const history = await openHistory(user)

    expect(within(history).getByRole('button', { name: 'Voltar' })).toHaveFocus()
    expect(screen.getByText('Conversas', { selector: '[aria-live]' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Mensagem' })).toBeNull()
    const groups = within(history).getAllByRole('region')
    expect(groups.map((group) => within(group).getByRole('heading').textContent)).toEqual([
      'Hoje',
      'Ontem',
      'Esta semana',
      'Mais antigas',
    ])
    expect(
      within(groups[2] ?? history).getByRole('button', { name: 'Por que a segunda foi pesada?' }),
    ).toBeVisible()

    await user.click(within(history).getByRole('button', { name: 'Por que a segunda foi pesada?' }))

    expect(actions.load).toHaveBeenCalledWith('c-week')
    expect(await screen.findByText('Teve pouco sono.')).toBeVisible()
    expect(
      screen.getByRole('dialog', { name: 'Por que a segunda foi pesada?' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toHaveFocus()
  })

  it('goes back to the chat with the back button and puts the focus on the history button', async () => {
    const { user } = renderSheet({ overview: overview(true, week), contacts: [] })

    const history = await openHistory(user)
    await user.click(within(history).getByRole('button', { name: 'Voltar' }))

    expect(screen.getByRole('button', { name: 'Conversas' })).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toBeVisible()
    expect(screen.getByText('Cogni', { selector: '[aria-live]' })).toBeInTheDocument()
  })

  it('starts a new conversation from the history header', async () => {
    const { actions, user } = renderSheet({ overview: overview(true, week), contacts: [] })
    actions.load.mockResolvedValue({
      ok: true,
      value: {
        ...summary('c-today', 'Como dormi esta semana?', '2026-10-22T13:00:00Z'),
        messages: [message('user', 'Como dormi esta semana?'), message('assistant', 'Bem.')],
      },
    })
    const first = await openHistory(user)
    await user.click(within(first).getByRole('button', { name: 'Como dormi esta semana?' }))
    await screen.findByText('Bem.')

    const history = await openHistory(user)
    await user.click(within(history).getByRole('button', { name: 'Nova conversa' }))

    expect(screen.getByRole('dialog', { name: 'Cogni' })).toBeInTheDocument()
    expect(screen.queryByText('Bem.')).toBeNull()
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toHaveFocus()
  })

  it('deletes a conversation from its menu only after a confirmation', async () => {
    const { actions, user } = renderSheet({
      overview: overview(true, week.slice(0, 1)),
      contacts: [],
    })
    const history = await openHistory(user)
    const more = within(history).getByRole('button', {
      name: 'Mais opções para Como dormi esta semana?',
    })

    await user.click(more)
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    let confirm = screen.getByRole('alertdialog', { name: 'Apagar esta conversa?' })
    expect(confirm).toHaveAccessibleDescription(
      '“Como dormi esta semana?” sai do histórico. Não dá para desfazer.',
    )
    expect(within(confirm).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }))

    expect(actions.remove).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(more).toHaveFocus()
    })

    await user.click(more)
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    confirm = screen.getByRole('alertdialog', { name: 'Apagar esta conversa?' })
    await user.click(within(confirm).getByRole('button', { name: 'Apagar' }))

    expect(actions.remove).toHaveBeenCalledWith('c-today')
    expect(await screen.findByText('Suas conversas aparecem aqui.')).toBeVisible()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('uses Escape to leave a menu, then the history, then the sheet', async () => {
    const { onClosed, user } = renderSheet({ overview: overview(true, week), contacts: [] })
    const history = await openHistory(user)

    await user.click(
      within(history).getByRole('button', { name: 'Mais opções para Como foi setembro?' }),
    )
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Conversas' })).toBeInTheDocument()

    await user.click(
      within(history).getByRole('button', { name: 'Mais opções para Como foi setembro?' }),
    )
    expect(screen.getByRole('menuitem', { name: 'Apagar' })).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })
    expect(screen.getByRole('dialog', { name: 'Conversas' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: 'Cogni' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Conversas' })).toHaveFocus()
    expect(onClosed).not.toHaveBeenCalled()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(onClosed).toHaveBeenCalled()
    })
  })

  it('gives the professional chat the same header and that patient history', async () => {
    const target: AssistantTarget = { mode: 'professional', patientId: 'p-1' }
    const { actions, user } = renderSheet(
      {
        overview: overview(true, [
          { ...week[0], mode: 'professional' } as AssistantConversationSummary,
        ]),
        contacts: [],
      },
      target,
      'Ana Lima',
    )

    const chat = screen.getByRole('dialog', { name: 'Cogni' })
    expect(await within(chat).findByText('Sobre Ana Lima')).toBeVisible()
    expect(within(chat).getByRole('button', { name: 'Nova conversa' })).toBeInTheDocument()
    expect(actions.open).toHaveBeenCalledWith(target)

    const history = await openHistory(user)
    expect(within(history).getByRole('button', { name: 'Como dormi esta semana?' })).toBeVisible()
  })
})
