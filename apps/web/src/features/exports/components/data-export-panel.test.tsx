import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { DataExport } from '@mycogni/contracts'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { DataExportPanel, type DataExportActions } from './data-export-panel'

const now = '2026-10-22T15:00:00.000Z'

const queued: DataExport = {
  id: '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10',
  status: 'queued',
  requestedAt: now,
  readyAt: null,
  expiresAt: null,
  sizeBytes: null,
}

const ready: DataExport = {
  ...queued,
  status: 'ready',
  readyAt: now,
  expiresAt: '2026-10-29T15:00:00.000Z',
  sizeBytes: 12_400_000,
}

function actions(overrides: Partial<DataExportActions> = {}) {
  return {
    prepare: jest
      .fn<() => Promise<ActionResult<DataExport>>>()
      .mockResolvedValue({ ok: true, value: queued }),
    latest: jest.fn<() => Promise<DataExport | null>>().mockResolvedValue(ready),
    download: jest
      .fn<(id: string) => Promise<ActionResult<string>>>()
      .mockResolvedValue({ ok: true, value: 'https://files.exemplo.com/dados.zip' }),
    ...overrides,
  }
}

function renderPanel(
  initial: DataExport | null,
  fake = actions(),
  locale: 'pt-BR' | 'en-US' = 'pt-BR',
) {
  renderWithIntl(
    <DataExportPanel
      initial={initial}
      timeZone="America/Sao_Paulo"
      now={now}
      actions={fake}
      pollMs={20}
    />,
    { locale },
  )
  return { fake, user: userEvent.setup() }
}

describe('DataExportPanel', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('offers to prepare the data and says how it works', async () => {
    const { fake, user } = renderPanel(null)

    expect(
      screen.getByText('Leva alguns minutos. Avisamos por email e aqui quando estiver pronto.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Preparar meus dados' }))

    expect(fake.prepare).toHaveBeenCalled()
    expect(await screen.findByRole('status')).toHaveTextContent('Preparando seus dados…')
  })

  it('checks again while preparing and shows the file once it is ready', async () => {
    const { fake } = renderPanel(queued)

    expect(screen.getByRole('status')).toHaveTextContent('Preparando seus dados…')
    expect(
      await screen.findByText('Pronto · 12,4 MB · disponível até 29 de out.'),
    ).toBeInTheDocument()
    expect(fake.latest).toHaveBeenCalled()
    expect(screen.queryByText(/Leva alguns minutos/)).not.toBeInTheDocument()
  })

  it('downloads the ready file through a short-lived link', async () => {
    const assign = jest.fn<(url: string) => void>()
    const user = userEvent.setup()
    const fake = actions()
    renderWithIntl(
      <DataExportPanel
        initial={ready}
        timeZone="America/Sao_Paulo"
        now={now}
        actions={fake}
        open={assign}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Baixar' }))

    expect(fake.download).toHaveBeenCalledWith(ready.id)
    expect(assign).toHaveBeenCalledWith('https://files.exemplo.com/dados.zip')
  })

  it('offers to prepare again after it expired or failed', () => {
    renderPanel({ ...ready, expiresAt: '2026-10-21T15:00:00.000Z' })
    expect(screen.getByRole('status')).toHaveTextContent('O arquivo anterior expirou.')
    expect(screen.getByRole('button', { name: 'Preparar de novo' })).toBeInTheDocument()
  })

  it('says when preparing failed and when the daily limit was reached', async () => {
    const { user } = renderPanel(
      { ...queued, status: 'failed' },
      actions({
        prepare: () => Promise.resolve({ ok: false, error: 'Você já pediu 3 vezes hoje.' }),
      }),
      'en-US',
    )

    expect(screen.getByRole('status')).toHaveTextContent('We couldn’t prepare your data.')
    await user.click(screen.getByRole('button', { name: 'Prepare again' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Você já pediu 3 vezes hoje.')
  })
})
