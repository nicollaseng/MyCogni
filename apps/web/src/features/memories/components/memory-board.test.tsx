import { describe, expect, it, jest } from '@jest/globals'
import type { Memory } from '@mycogni/contracts'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { ShownMemory } from '../shown-memory'
import { MemoryBoard, type MemoryActions } from './memory-board'

const walk: ShownMemory = {
  id: '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10',
  content: 'Caminhar ajuda a se acalmar.',
  status: 'active',
  hint: 'De um registro de 15 de out.',
}

const sister: ShownMemory = {
  id: '7a2d5b63-72a8-4d2c-8e4d-2c1e3b5a3b21',
  content: 'A irmã é uma pessoa importante.',
  status: 'active',
  hint: 'De uma conversa',
}

const old: ShownMemory = {
  id: '8b3e6c74-83b9-4e3d-9f5e-3d2f4c6b4c32',
  content: 'Trabalhava à noite.',
  status: 'archived',
  hint: 'Do MyBook',
}

function saved(content: string, id = '9c4f7d85-94ca-4f4e-8a6f-4e3a5d7c5d43'): Memory {
  return {
    id,
    content,
    kind: 'fact',
    origin: 'manual',
    importance: 3,
    status: 'active',
    sources: [],
    createdAt: '2026-10-22T12:00:00.000Z',
    updatedAt: '2026-10-22T12:00:00.000Z',
  }
}

function actions(overrides: Partial<MemoryActions> = {}) {
  return {
    add: jest
      .fn<(content: string) => Promise<ActionResult<Memory>>>()
      .mockImplementation((content) => Promise.resolve({ ok: true, value: saved(content) })),
    edit: jest
      .fn<(id: string, content: string) => Promise<ActionResult<Memory>>>()
      .mockImplementation((id, content) =>
        Promise.resolve({ ok: true, value: saved(content, id) }),
      ),
    remove: jest
      .fn<(id: string) => Promise<ActionResult<null>>>()
      .mockResolvedValue({ ok: true, value: null }),
    clear: jest
      .fn<() => Promise<ActionResult<null>>>()
      .mockResolvedValue({ ok: true, value: null }),
    ...overrides,
  }
}

function renderBoard(initial: readonly ShownMemory[], fake = actions()) {
  renderWithIntl(<MemoryBoard initial={initial} actions={fake} />)
  return { fake, user: userEvent.setup() }
}

describe('MemoryBoard', () => {
  it('lists each memory with where it came from and keeps old ones folded', () => {
    renderBoard([walk, sister, old])

    const [current] = screen.getAllByRole('list')
    expect(within(current ?? document.body).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Caminhar ajuda a se acalmar.')).toBeVisible()
    expect(screen.getByText('De um registro de 15 de out.')).toBeVisible()
    expect(screen.getByText('De uma conversa')).toBeVisible()
    expect(screen.getByText('Memórias antigas')).toBeInTheDocument()
    expect(screen.getByText('Trabalhava à noite.')).not.toBeVisible()
  })

  it('says when nothing is kept yet', () => {
    renderBoard([])

    expect(screen.getByText('Nada guardado ainda.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apagar todas' })).not.toBeInTheDocument()
  })

  it('adds a memory the person writes at the top', async () => {
    const { fake, user } = renderBoard([walk])

    await user.click(screen.getByRole('button', { name: 'Adicionar memória' }))
    const field = screen.getByLabelText('Nova memória')
    expect(field).toHaveFocus()
    await user.type(field, 'Gosto de chá de camomila.')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(fake.add).toHaveBeenCalledWith('Gosto de chá de camomila.')
    expect(await screen.findByRole('status')).toHaveTextContent('Memória salva.')
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Gosto de chá de camomila.Adicionada por você')
  })

  it('shows why a memory could not be saved', async () => {
    const { user } = renderBoard(
      [],
      actions({ add: () => Promise.resolve({ ok: false, error: 'Escreva a memória.' }) }),
    )

    await user.click(screen.getByRole('button', { name: 'Adicionar memória' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Escreva a memória.')
    expect(screen.getByLabelText('Nova memória')).toHaveAttribute('aria-invalid', 'true')
  })

  it('edits a memory in place and keeps its source', async () => {
    const { fake, user } = renderBoard([walk])

    await user.click(screen.getByRole('button', { name: `Editar: ${walk.content}` }))
    const field = screen.getByLabelText('Memória')
    await user.clear(field)
    await user.type(field, 'Caminhar à tarde ajuda a se acalmar.')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(fake.edit).toHaveBeenCalledWith(walk.id, 'Caminhar à tarde ajuda a se acalmar.')
    expect(await screen.findByText('Caminhar à tarde ajuda a se acalmar.')).toBeInTheDocument()
    expect(screen.getByText('De um registro de 15 de out.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Memória atualizada.')
  })

  it('leaves the edit with Escape without saving', async () => {
    const { fake, user } = renderBoard([walk])

    await user.click(screen.getByRole('button', { name: `Editar: ${walk.content}` }))
    await user.keyboard('{Escape}')

    expect(fake.edit).not.toHaveBeenCalled()
    expect(screen.getByText(walk.content)).toBeInTheDocument()
  })

  it('deletes one memory', async () => {
    const { fake, user } = renderBoard([walk, sister])

    await user.click(screen.getByRole('button', { name: `Apagar: ${sister.content}` }))

    expect(fake.remove).toHaveBeenCalledWith(sister.id)
    await waitFor(() => {
      expect(screen.queryByText(sister.content)).not.toBeInTheDocument()
    })
    expect(screen.getByRole('status')).toHaveTextContent('Memória apagada.')
  })

  it('asks before deleting everything and keeps it all when canceled', async () => {
    const { fake, user } = renderBoard([walk, sister, old])

    await user.click(screen.getByRole('button', { name: 'Apagar todas' }))
    const confirm = screen.getByRole('alertdialog', { name: 'Apagar todas as memórias?' })
    expect(confirm).toHaveAccessibleDescription(
      'O Cogni esquece tudo o que guardou. Não dá para desfazer.',
    )
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(fake.clear).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Apagar todas' }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Apagar todas' }),
    )

    expect(fake.clear).toHaveBeenCalled()
    expect(await screen.findByText('Nada guardado ainda.')).toBeInTheDocument()
    expect(screen.queryByText('Memórias antigas')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Memórias apagadas.')
  })

  it('speaks European Portuguese', () => {
    renderWithIntl(<MemoryBoard initial={[]} actions={actions()} />, { locale: 'pt-PT' })

    expect(screen.getByText('Ainda não há nada guardado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar memória' })).toBeInTheDocument()
  })
})
