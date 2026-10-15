import { describe, expect, it, jest } from '@jest/globals'
import type { CreateJournalShareInput } from '@mycogni/contracts'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { now, summaryOf, timeZone } from '../test-data'
import { ShareFlow } from './share-flow'

type Share = (input: CreateJournalShareInput) => Promise<ActionResult<null>>

const careLinkId = '3e2d1c0b-0000-4000-8000-000000000001'

const pages = [
  summaryOf({ id: '8a7d3c1e-0000-4000-8000-000000000001', title: 'Um domingo mais leve' }),
  summaryOf({
    id: '8a7d3c1e-0000-4000-8000-000000000002',
    title: 'Conversa difícil',
    excerpt: 'A reunião de hoje',
  }),
]

function renderFlow(share: Share, preselected: string[] = []) {
  renderWithIntl(
    <ShareFlow
      careLinkId={careLinkId}
      name="Helena Prado"
      pages={pages}
      preselected={preselected}
      initiallyOpen={false}
      hasShares={false}
      now={now.toISOString()}
      timeZone={timeZone}
      share={share}
    />,
  )
}

function succeed(): Promise<ActionResult<null>> {
  return Promise.resolve({ ok: true, value: null })
}

describe('ShareFlow', () => {
  it('asks for pages, then states who reads what until when', async () => {
    const share = jest.fn<Share>(succeed)
    renderFlow(share)

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(screen.getByRole('radio', { name: 'Páginas escolhidas' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '7 dias' })).toBeChecked()
    expect(screen.getByText('Escolha ao menos uma página.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', { name: /Um domingo mais leve/ }))

    expect(
      screen.getByText(
        'Helena Prado poderá ler a página “Um domingo mais leve” até 22 de outubro. Você pode encerrar quando quiser.',
      ),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: /Conversa difícil/ }))
    await userEvent.click(screen.getByRole('radio', { name: '30 dias' }))

    expect(
      screen.getByText(
        'Helena Prado poderá ler 2 páginas escolhidas até 14 de novembro. Você pode encerrar quando quiser.',
      ),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(share).toHaveBeenCalledWith({
      careLinkId,
      scope: 'entries',
      entryIds: ['8a7d3c1e-0000-4000-8000-000000000001', '8a7d3c1e-0000-4000-8000-000000000002'],
      expiresAt: expect.any(String),
    })
    expect(await screen.findByRole('button', { name: 'Compartilhar' })).toBeEnabled()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('shares the whole journal until a chosen date or with no end', async () => {
    const share = jest.fn<Share>(succeed)
    renderFlow(share)
    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))

    await userEvent.click(screen.getByRole('radio', { name: /MyBook inteiro/ }))
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Até uma data' }))
    expect(screen.getByText('Escolha uma data a partir de amanhã.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-10-20' } })
    expect(
      screen.getByText(
        'Helena Prado poderá ler todo o seu MyBook até 20 de outubro. Você pode encerrar quando quiser.',
      ),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))
    expect(share).toHaveBeenLastCalledWith({
      careLinkId,
      scope: 'all',
      expiresAt: '2026-10-21T02:59:59.999Z',
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }))
    await userEvent.click(screen.getByRole('radio', { name: /MyBook inteiro/ }))
    await userEvent.click(screen.getByRole('radio', { name: 'Sem prazo' }))

    expect(
      screen.getByText(
        'Helena Prado poderá ler todo o seu MyBook sem prazo. Você pode encerrar quando quiser.',
      ),
    ).toBeInTheDocument()
  })

  it('finds pages to choose by searching and keeps the chosen ones', async () => {
    renderFlow(succeed, ['8a7d3c1e-0000-4000-8000-000000000001'])
    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(screen.getByRole('checkbox', { name: /Um domingo mais leve/ })).toBeChecked()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar páginas' }), 'reuniao')

    expect(await screen.findByRole('checkbox', { name: /Conversa difícil/ })).not.toBeChecked()
    expect(screen.queryByRole('checkbox', { name: /Um domingo/ })).not.toBeInTheDocument()
    expect(screen.getByText('1 página escolhida')).toBeInTheDocument()
  })

  it('keeps the choices and explains when sharing fails', async () => {
    renderFlow(
      () => Promise.resolve({ ok: false, error: 'Não conseguimos compartilhar agora.' }),
      ['8a7d3c1e-0000-4000-8000-000000000001'],
    )
    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos compartilhar agora.',
    )
    expect(screen.getByRole('checkbox', { name: /Um domingo mais leve/ })).toBeChecked()
  })
})
