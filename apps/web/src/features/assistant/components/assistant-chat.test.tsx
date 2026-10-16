import { describe, expect, it } from '@jest/globals'
import type { AssistantExchange } from '@mycogni/contracts'
import { assistantNotice } from '@mycogni/domain'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { AssistantState, AssistantTarget } from '../model'
import { conversationId, deferred, exchange, fakeActions, message, overview } from '../test-data'
import { AssistantChat } from './assistant-chat'

const personal: AssistantTarget = { mode: 'personal' }

const contacts = [{ name: 'Dra. Helena Prado' }]

function renderChat(state: AssistantState, target: AssistantTarget = personal) {
  const actions = fakeActions(state)
  const user = userEvent.setup()
  renderWithIntl(<AssistantChat target={target} actions={actions} timeZone="America/Sao_Paulo" />)
  return { actions, user }
}

function input(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Mensagem' })
}

describe('AssistantChat', () => {
  it('asks once for permission to read the records and remembers the answer', async () => {
    const { actions, user } = renderChat({ overview: overview(false), contacts })

    const prompt = await screen.findByRole('region', { name: 'Posso ler os seus registros?' })
    await user.click(within(prompt).getByRole('checkbox', { name: 'Ler também o MyBook' }))
    await user.click(within(prompt).getByRole('button', { name: 'Permitir' }))

    expect(actions.allow).toHaveBeenCalledWith(true)
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Posso ler os seus registros?' })).toBeNull()
    })
    expect(screen.queryByText(/respondo de forma geral/)).toBeNull()
  })

  it('answers in general terms when the person says not now', async () => {
    const { actions, user } = renderChat({ overview: overview(false), contacts })

    await user.click(await screen.findByRole('button', { name: 'Agora não' }))

    expect(actions.allow).not.toHaveBeenCalled()
    expect(
      screen.getByText('Sem permissão para ler os seus registros, eu respondo de forma geral.'),
    ).toBeInTheDocument()
  })

  it('shows the question, a pending state and then the answer', async () => {
    const { actions, user } = renderChat({ overview: overview(true), contacts })
    const answer = deferred<ActionResult<AssistantExchange>>()
    actions.send.mockImplementation(() => answer.promise)

    await screen.findByText('Como foi meu humor nas últimas duas semanas?')
    await user.type(input(), 'Como dormi?')
    expect(screen.queryByText('11 de 1000')).toBeNull()
    await user.keyboard('{Enter}')

    expect(actions.send).toHaveBeenCalledWith(personal, null, 'Como dormi?')
    expect(screen.getByRole('status')).toHaveTextContent('Escrevendo a resposta…')
    expect(within(screen.getByRole('log')).getByText('Como dormi?')).toBeInTheDocument()
    expect(input()).toHaveValue('')

    answer.resolve({
      ok: true,
      value: exchange('Como dormi?', message('assistant', 'Você dormiu melhor no fim de semana.')),
    })

    expect(await screen.findByText('Você dormiu melhor no fim de semana.')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Apoio agora' })).toBeNull()
  })

  it('sends a starter suggestion with one tap', async () => {
    const { actions, user } = renderChat({ overview: overview(true), contacts })

    await user.click(
      await screen.findByRole('button', { name: 'O que parece me ajudar nos dias bons?' }),
    )

    expect(actions.send).toHaveBeenCalledWith(
      personal,
      null,
      'O que parece me ajudar nos dias bons?',
    )
  })

  it('keeps a calm note under the message and counts characters only near the limit', async () => {
    const { user } = renderChat({ overview: overview(true), contacts })

    expect(
      await screen.findByText(
        'IA pode cometer erros. Essa conversa não substitui um aconselhamento de saúde profissional.',
      ),
    ).toBeVisible()
    expect(screen.queryByText('Não substitui um profissional.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ajuda agora' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Apoio agora' })).toBeNull()

    await user.click(input())
    await user.paste('a'.repeat(899))
    expect(screen.queryByText('899 de 1000')).toBeNull()
    await user.type(input(), 'a')
    expect(screen.getByText('900 de 1000')).toBeVisible()
  })

  it('answers a crisis with the short notice and the crisis card right after it', async () => {
    const { actions, user } = renderChat({ overview: overview(true), contacts })
    const notice = assistantNotice('pt-BR', 'personal', 'crisis')
    actions.send.mockResolvedValue({
      ok: true,
      value: exchange('quero morrer', message('notice', notice, 'urgent')),
    })

    await user.type(input(), 'quero morrer{Enter}')

    const card = await screen.findByRole('region', { name: 'Apoio agora' })
    expect(within(screen.getByRole('log')).getByText(notice)).toBeInTheDocument()
    expect(notice).toBe(
      'Que bom que você me contou. Você merece o apoio de uma pessoa agora: ligue para um dos contatos abaixo.',
    )
    expect(card).toHaveTextContent(
      'Você não precisa passar por isso sem apoio: fale com alguém agora.',
    )
    expect(card).toHaveTextContent('Dra. Helena Prado acompanha você.')
    expect(within(card).getByRole('link', { name: '188 CVV' })).toHaveAttribute('href', 'tel:188')
    expect(within(card).getByRole('link', { name: '192 SAMU' })).toHaveAttribute('href', 'tel:192')
    expect(within(card).queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows no crisis card for worrying answers or refusals', async () => {
    const { actions, user } = renderChat({ overview: overview(true), contacts })
    actions.send.mockResolvedValueOnce({
      ok: true,
      value: exchange(
        'Ando triste',
        message('assistant', 'Sinto muito que esteja pesado.', 'watch'),
      ),
    })
    actions.send.mockResolvedValueOnce({
      ok: true,
      value: exchange('Me dá a senha', message('notice', 'Não posso ajudar com esse pedido.')),
    })

    await user.type(input(), 'Ando triste{Enter}')
    await screen.findByText('Sinto muito que esteja pesado.')
    await user.type(input(), 'Me dá a senha{Enter}')
    await screen.findByText('Não posso ajudar com esse pedido.')

    expect(screen.queryByRole('region', { name: 'Apoio agora' })).toBeNull()
  })

  it('shows the card only next to the urgent answer when an old conversation opens', async () => {
    const earlier = {
      id: conversationId,
      mode: 'personal' as const,
      risk: 'urgent' as const,
      preview: 'Vontade de morrer',
      createdAt: '2026-10-14T13:00:00Z',
      updatedAt: '2026-10-14T13:05:00Z',
    }
    const { actions, user } = renderChat({ overview: overview(true, [earlier]), contacts })
    actions.load.mockResolvedValue({
      ok: true,
      value: {
        ...earlier,
        messages: [
          message('user', 'Vontade de morrer', 'urgent'),
          message('notice', 'Que bom que você me contou.', 'urgent'),
          message('user', 'E agora?', 'watch'),
          message('assistant', 'Estou aqui com você.', 'watch'),
        ],
      },
    })

    await user.click(await screen.findByRole('button', { name: 'Conversas' }))
    await user.click(screen.getByRole('menuitem', { name: /Vontade de morrer/ }))
    await screen.findByText('Estou aqui com você.')

    const [card, ...others] = screen.getAllByRole('region', { name: 'Apoio agora' })
    expect(others).toHaveLength(0)
    const notice = screen.getByText('Que bom que você me contou.').closest('[data-role]')
    expect(notice?.contains(card ?? null)).toBe(true)
  })

  it('explains the limit and keeps the text when there were too many messages', async () => {
    const { actions, user } = renderChat({ overview: overview(true), contacts })
    actions.send.mockResolvedValue({
      ok: false,
      error: 'Você mandou muitas mensagens em pouco tempo. Tente de novo mais tarde.',
    })

    await user.type(input(), 'Mais uma pergunta{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Você mandou muitas mensagens')
    expect(input()).toHaveValue('Mais uma pergunta')
    expect(within(screen.getByRole('log')).queryByText('Mais uma pergunta')).toBeNull()
  })

  it('opens an earlier conversation and deletes it after a confirmation', async () => {
    const earlier = {
      id: conversationId,
      mode: 'personal' as const,
      risk: 'none' as const,
      preview: 'Como foi a semana?',
      createdAt: '2026-10-14T13:00:00Z',
      updatedAt: '2026-10-14T13:05:00Z',
    }
    const { actions, user } = renderChat({ overview: overview(true, [earlier]), contacts })
    actions.load.mockResolvedValue({
      ok: true,
      value: {
        ...earlier,
        messages: [message('user', 'Como foi a semana?'), message('assistant', 'Foi estável.')],
      },
    })

    await user.click(await screen.findByRole('button', { name: 'Conversas' }))
    await user.click(screen.getByRole('menuitem', { name: /Como foi a semana\?/ }))

    expect(actions.load).toHaveBeenCalledWith(conversationId)
    expect(await screen.findByText('Foi estável.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Apagar' }))
    await user.click(screen.getByRole('button', { name: 'Apagar conversa' }))

    expect(actions.remove).toHaveBeenCalledWith(conversationId)
    await waitFor(() => {
      expect(screen.queryByText('Foi estável.')).toBeNull()
    })
    await user.click(screen.getByRole('button', { name: 'Conversas' }))
    expect(screen.getByText('Nenhuma conversa ainda')).toBeInTheDocument()
  })

  it('starts a new conversation without the previous messages', async () => {
    const { actions, user } = renderChat({ overview: overview(true), contacts })
    actions.send.mockResolvedValue({
      ok: true,
      value: exchange('Oi', message('assistant', 'Olá, como você está?')),
    })
    await user.type(input(), 'Oi{Enter}')
    await screen.findByText('Olá, como você está?')

    await user.click(screen.getByRole('button', { name: 'Nova conversa' }))

    expect(screen.queryByText('Olá, como você está?')).toBeNull()
    expect(screen.getByText('Como foi meu humor nas últimas duas semanas?')).toBeInTheDocument()
    await user.type(input(), 'Outra{Enter}')
    expect(actions.send).toHaveBeenLastCalledWith(personal, null, 'Outra')
  })

  it('speaks to a professional about one patient, in a clinical tone', async () => {
    const target: AssistantTarget = { mode: 'professional', patientId: conversationId }
    const { actions, user } = renderChat({ overview: overview(false), contacts: [] }, target)
    actions.send.mockResolvedValueOnce({
      ok: true,
      value: exchange('Risco?', message('assistant', 'Item 9 positivo em outubro.', 'watch')),
    })
    actions.send.mockResolvedValueOnce({
      ok: true,
      value: exchange('E hoje?', message('assistant', 'Escreveu que quer morrer.', 'urgent')),
    })

    expect(
      await screen.findByText(
        'Este paciente não autorizou o uso de IA nos registros dele. As respostas são gerais.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('IA pode cometer erros. Não substitui o seu julgamento clínico.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ajuda agora' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Posso ler os seus registros?' })).toBeNull()

    await user.type(input(), 'Risco?{Enter}')
    await screen.findByText('Item 9 positivo em outubro.')
    expect(screen.queryByRole('note', { name: 'Sinais de risco' })).toBeNull()

    await user.type(input(), 'E hoje?{Enter}')
    expect(await screen.findByRole('note', { name: 'Sinais de risco' })).toBeInTheDocument()
    expect(actions.send).toHaveBeenCalledWith(target, null, 'Risco?')
  })
})
