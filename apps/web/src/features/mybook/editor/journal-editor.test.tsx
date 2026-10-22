import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals'
import type { JournalEntry, JournalNode, UpdateJournalEntryInput } from '@mycogni/contracts'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { fakeRouter, WithRouter } from '@/test/router'
import { installVisualViewport } from '@/test/visual-viewport'
import { exchange, fakeActions, message, overview } from '@/features/assistant/test-data'
import { readDraft, writeDraft } from '../drafts'
import type { PageClient, RemoveOutcome, SaveOutcome } from '../page-client'
import { JournalEditor } from './journal-editor'

type Save = (id: string, input: UpdateJournalEntryInput) => Promise<SaveOutcome>

const savedAt = '2026-10-15T15:00:00.000Z'

const patience = { timeout: 3000 }

function documentWith(text: string): JournalNode {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

const entry: JournalEntry = {
  id: '8a7d3c1e-0000-4000-8000-000000000001',
  title: 'Domingo',
  body: documentWith('Fui ao parque.'),
  plainText: 'Fui ao parque.',
  imagePaths: [],
  imageUrls: {},
  createdAt: '2026-10-15T12:00:00.000Z',
  updatedAt: savedAt,
}

function clientSaving(save: Save) {
  const client = {
    create: jest.fn<PageClient['create']>(),
    save: jest.fn<Save>(save),
    remove: jest.fn<(id: string) => Promise<RemoveOutcome>>(() => Promise.resolve('removed')),
  }
  renderWithIntl(
    <WithRouter router={fakeRouter()}>
      <JournalEditor entry={entry} timeZone="America/Sao_Paulo" client={client} />
    </WithRouter>,
  )
  return client
}

function titleField() {
  return screen.getByRole('textbox', { name: 'Título da página' })
}

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement('span').getClientRects()
  Range.prototype.getBoundingClientRect = () =>
    document.createElement('span').getBoundingClientRect()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('JournalEditor saving', () => {
  it('keeps a copy on this device while saving and clears it once the page is saved', async () => {
    const client = clientSaving(() =>
      Promise.resolve({ kind: 'saved', updatedAt: '2026-10-15T15:01:00.000Z', safety: null }),
    )

    await userEvent.type(titleField(), ' de sol')

    expect(readDraft(entry.id)?.title).toBe('Domingo de sol')
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Salvo')
    }, patience)
    expect(client.save).toHaveBeenCalledWith(
      entry.id,
      expect.objectContaining({ title: 'Domingo de sol', plainText: 'Fui ao parque.' }),
    )
    expect(readDraft(entry.id)).toBeNull()
  })

  it('keeps the copy when the save fails and offers to try again', async () => {
    clientSaving(() => Promise.resolve({ kind: 'failed' }))

    await userEvent.type(titleField(), ' de sol')

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Não foi possível salvar.')
    }, patience)
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    expect(readDraft(entry.id)?.title).toBe('Domingo de sol')
  })

  it('asks to reload when the app was updated and says the text is kept', async () => {
    const client = clientSaving(() => Promise.resolve({ kind: 'outdated' }))

    await userEvent.type(titleField(), ' de sol')

    expect(await screen.findByRole('alert', {}, patience)).toHaveTextContent(
      'O app foi atualizado. Recarregue para continuar — seu texto está guardado.',
    )
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument()
    expect(readDraft(entry.id)?.title).toBe('Domingo de sol')

    await userEvent.type(titleField(), '!')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(client.save).toHaveBeenCalledTimes(1)
  })
})

describe('JournalEditor support', () => {
  it('offers support above the page after the save that needs it, without taking the cursor', async () => {
    const client = clientSaving(() =>
      Promise.resolve({
        kind: 'saved',
        updatedAt: '2026-10-15T15:01:00.000Z',
        safety: { professionals: [{ name: 'Helena Prado', emergencyWhatsapp: null }] },
      }),
    )
    const field = titleField()

    await userEvent.type(field, ' sem saída')
    const panel = await screen.findByRole('region', { name: 'Apoio agora' }, patience)

    expect(field).toHaveFocus()
    expect(panel).toHaveTextContent('Helena Prado acompanha você.')
    expect(within(panel).getByRole('link', { name: '188 CVV' })).toHaveAttribute('href', 'tel:188')
    await userEvent.keyboard(' hoje')
    expect(field).toHaveValue('Domingo sem saída hoje')
    expect(field).toHaveFocus()
    expect(client.save).toHaveBeenCalled()
  })

  it('stays folded on this page once dismissed', async () => {
    const client = clientSaving(() =>
      Promise.resolve({
        kind: 'saved',
        updatedAt: '2026-10-15T15:01:00.000Z',
        safety: { professionals: [] },
      }),
    )

    await userEvent.type(titleField(), ' triste')
    const panel = await screen.findByRole('region', { name: 'Apoio agora' }, patience)
    await userEvent.click(within(panel).getByRole('button', { name: 'Fechar apoio' }))
    const calls = client.save.mock.calls.length
    await userEvent.type(titleField(), ' de novo')

    await waitFor(() => {
      expect(client.save.mock.calls.length).toBeGreaterThan(calls)
    }, patience)
    expect(screen.queryByRole('region', { name: 'Apoio agora' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajuda agora' })).toBeInTheDocument()
  })

  it('stays out of the way while nothing calls for support', async () => {
    const client = clientSaving(() =>
      Promise.resolve({ kind: 'saved', updatedAt: '2026-10-15T15:01:00.000Z', safety: null }),
    )

    await userEvent.type(titleField(), ' de sol')

    await waitFor(() => {
      expect(client.save).toHaveBeenCalled()
    }, patience)
    expect(screen.queryByRole('region', { name: 'Apoio agora' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ajuda agora' })).not.toBeInTheDocument()
  })
})

describe('JournalEditor assistant', () => {
  it('asks about the page from its header after saving what is being written', async () => {
    const steps: string[] = []
    const client = {
      create: jest.fn<PageClient['create']>(),
      save: jest.fn<Save>(() => {
        steps.push('save')
        return Promise.resolve({ kind: 'saved', updatedAt: savedAt, safety: null })
      }),
      remove: jest.fn<(id: string) => Promise<RemoveOutcome>>(() => Promise.resolve('removed')),
    }
    const actions = fakeActions({ overview: overview(true), contacts: [] })
    actions.send.mockImplementation(() => {
      steps.push('send')
      return Promise.resolve({
        ok: true,
        value: exchange('Resuma esta página', message('assistant', 'Fala de um domingo.')),
      })
    })
    renderWithIntl(
      <WithRouter router={fakeRouter()}>
        <JournalEditor
          entry={entry}
          timeZone="America/Sao_Paulo"
          client={client}
          assistantActions={actions}
        />
      </WithRouter>,
    )

    await userEvent.type(titleField(), ' de sol')
    await userEvent.click(screen.getByRole('button', { name: 'Conversar com o Cogni' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Resuma esta página' }))

    expect(await screen.findByText('Fala de um domingo.')).toBeVisible()
    expect(steps).toEqual(['save', 'send'])
    expect(client.save).toHaveBeenCalledWith(
      entry.id,
      expect.objectContaining({ title: 'Domingo de sol' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(titleField()).toHaveValue('Domingo de sol')
  })

  it('stays out of the editor when the assistant is not available', () => {
    clientSaving(() => Promise.resolve({ kind: 'saved', updatedAt: savedAt, safety: null }))

    expect(screen.queryByRole('button', { name: 'Conversar com o Cogni' })).not.toBeInTheDocument()
  })
})

describe('JournalEditor drafts', () => {
  it('restores a newer copy kept on this device and saves it', async () => {
    writeDraft(entry.id, {
      base: savedAt,
      writtenAt: Date.parse('2026-10-15T15:02:00.000Z'),
      title: 'Domingo sem chuva',
      body: documentWith('Fui ao parque e voltei a pé.'),
      imageUrls: {},
    })
    const client = clientSaving(() =>
      Promise.resolve({ kind: 'saved', updatedAt: '2026-10-15T15:03:00.000Z', safety: null }),
    )

    await waitFor(() => {
      expect(titleField()).toHaveValue('Domingo sem chuva')
    })
    expect(screen.getByRole('textbox', { name: 'Texto da página' })).toHaveTextContent(
      'Fui ao parque e voltei a pé.',
    )
    await waitFor(() => {
      expect(client.save).toHaveBeenCalledWith(
        entry.id,
        expect.objectContaining({
          title: 'Domingo sem chuva',
          plainText: 'Fui ao parque e voltei a pé.',
        }),
      )
    }, patience)
    await waitFor(() => {
      expect(readDraft(entry.id)).toBeNull()
    })
  })

  it('drops a copy older than the page on the server', async () => {
    writeDraft(entry.id, {
      base: '2026-10-15T14:00:00.000Z',
      writtenAt: Date.parse('2026-10-15T14:01:00.000Z'),
      title: 'Rascunho antigo',
      body: documentWith('Texto antigo.'),
      imageUrls: {},
    })
    const client = clientSaving(() =>
      Promise.resolve({ kind: 'saved', updatedAt: savedAt, safety: null }),
    )

    await waitFor(() => {
      expect(readDraft(entry.id)).toBeNull()
    })
    expect(titleField()).toHaveValue('Domingo')
    expect(screen.getByRole('textbox', { name: 'Texto da página' })).toHaveTextContent(
      'Fui ao parque.',
    )
    expect(client.save).not.toHaveBeenCalled()
  })
})

describe('JournalEditor on a phone keyboard', () => {
  it('makes room for the bar and the keyboard and hides the tab bar while writing', async () => {
    const viewport = installVisualViewport()
    clientSaving(() => Promise.resolve({ kind: 'saved', updatedAt: savedAt, safety: null }))
    const page = screen.getByRole('toolbar', { name: 'Formatação' }).parentElement

    await userEvent.click(titleField())
    viewport.showKeyboard(300)

    expect(page).toHaveStyle({ paddingBottom: `${String(48 + 300 + 24)}px` })
    expect(document.documentElement).toHaveAttribute('data-tab-bar', 'hidden')
    expect(screen.getByRole('toolbar', { name: 'Formatação' })).toHaveStyle({ bottom: '300px' })

    viewport.hideKeyboard()
    await userEvent.tab()

    expect(document.documentElement).not.toHaveAttribute('data-tab-bar')
    viewport.remove()
  })
})
