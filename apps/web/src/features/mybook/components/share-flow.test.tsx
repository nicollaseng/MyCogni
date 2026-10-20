import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { CreateJournalShareInput } from '@mycogni/contracts'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
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

async function openSheet() {
  await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))
  return within(screen.getByRole('dialog', { name: 'Compartilhar com Helena Prado' }))
}

describe('ShareFlow', () => {
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

  it('asks for pages, then states who reads what until when', async () => {
    const share = jest.fn<Share>(succeed)
    renderFlow(share)

    const sheet = await openSheet()

    expect(sheet.getByRole('radio', { name: 'Páginas escolhidas' })).toBeChecked()
    expect(sheet.getByRole('radio', { name: '7 dias' })).toBeChecked()
    expect(sheet.getByText('Escolha ao menos uma página.')).toBeInTheDocument()
    expect(sheet.getByRole('button', { name: 'Compartilhar' })).toBeDisabled()

    await userEvent.click(sheet.getByRole('checkbox', { name: /Um domingo mais leve/ }))

    expect(
      sheet.getByText(
        'Helena Prado poderá ler a página “Um domingo mais leve” até 22 de outubro. Você pode encerrar quando quiser.',
      ),
    ).toBeInTheDocument()

    await userEvent.click(sheet.getByRole('checkbox', { name: /Conversa difícil/ }))
    await userEvent.click(sheet.getByRole('radio', { name: '30 dias' }))

    expect(
      sheet.getByText(
        'Helena Prado poderá ler 2 páginas escolhidas até 14 de novembro. Você pode encerrar quando quiser.',
      ),
    ).toBeInTheDocument()

    await userEvent.click(sheet.getByRole('button', { name: 'Compartilhar' }))

    expect(share).toHaveBeenCalledWith({
      careLinkId,
      scope: 'entries',
      entryIds: ['8a7d3c1e-0000-4000-8000-000000000001', '8a7d3c1e-0000-4000-8000-000000000002'],
      expiresAt: expect.any(String),
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shares the whole journal until a chosen date or with no end', async () => {
    const share = jest.fn<Share>(succeed)
    renderFlow(share)
    let sheet = await openSheet()

    await userEvent.click(sheet.getByRole('radio', { name: 'MyBook inteiro' }))
    expect(sheet.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(
      sheet.getByText('Inclui as páginas que você escrever enquanto o compartilhamento durar.'),
    ).toBeInTheDocument()

    await userEvent.click(sheet.getByRole('radio', { name: 'Até uma data' }))
    expect(sheet.getByText('Escolha uma data a partir de amanhã.')).toBeInTheDocument()

    fireEvent.change(sheet.getByLabelText('Data final'), { target: { value: '2026-10-20' } })
    expect(
      sheet.getByText(
        'Helena Prado poderá ler todo o seu MyBook até 20 de outubro. Você pode encerrar quando quiser.',
      ),
    ).toBeInTheDocument()

    await userEvent.click(sheet.getByRole('button', { name: 'Compartilhar' }))
    expect(share).toHaveBeenLastCalledWith({
      careLinkId,
      scope: 'all',
      expiresAt: '2026-10-21T02:59:59.999Z',
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    sheet = await openSheet()
    await userEvent.click(sheet.getByRole('radio', { name: 'MyBook inteiro' }))
    await userEvent.click(sheet.getByRole('radio', { name: 'Sem prazo' }))

    expect(
      sheet.getByText(
        'Helena Prado poderá ler todo o seu MyBook sem prazo. Você pode encerrar quando quiser.',
      ),
    ).toBeInTheDocument()
  })

  it('finds pages to choose by searching and keeps the chosen ones', async () => {
    renderFlow(succeed, ['8a7d3c1e-0000-4000-8000-000000000001'])
    const sheet = await openSheet()

    expect(sheet.getByRole('checkbox', { name: /Um domingo mais leve/ })).toBeChecked()
    await userEvent.type(sheet.getByRole('searchbox', { name: 'Buscar páginas' }), 'reuniao')

    expect(await sheet.findByRole('checkbox', { name: /Conversa difícil/ })).not.toBeChecked()
    expect(sheet.queryByRole('checkbox', { name: /Um domingo/ })).not.toBeInTheDocument()
    expect(sheet.getByText('1 página escolhida')).toBeInTheDocument()
  })

  it('keeps the choices and explains when sharing fails', async () => {
    renderFlow(
      () => Promise.resolve({ ok: false, error: 'Não conseguimos compartilhar agora.' }),
      ['8a7d3c1e-0000-4000-8000-000000000001'],
    )
    const sheet = await openSheet()
    await userEvent.click(sheet.getByRole('button', { name: 'Compartilhar' }))

    expect(await sheet.findByRole('alert')).toHaveTextContent('Não conseguimos compartilhar agora.')
    expect(sheet.getByRole('checkbox', { name: /Um domingo mais leve/ })).toBeChecked()
  })

  it('closes without sharing when cancelled', async () => {
    const share = jest.fn<Share>(succeed)
    renderFlow(share)
    const sheet = await openSheet()

    await userEvent.click(sheet.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(share).not.toHaveBeenCalled()
  })
})
