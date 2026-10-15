import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals'
import type { JournalEntry, JournalNode, UpdateJournalEntryInput } from '@mycogni/contracts'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { fakeRouter, WithRouter } from '@/test/router'
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
      Promise.resolve({ kind: 'saved', updatedAt: '2026-10-15T15:01:00.000Z' }),
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
      Promise.resolve({ kind: 'saved', updatedAt: '2026-10-15T15:03:00.000Z' }),
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
    const client = clientSaving(() => Promise.resolve({ kind: 'saved', updatedAt: savedAt }))

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
