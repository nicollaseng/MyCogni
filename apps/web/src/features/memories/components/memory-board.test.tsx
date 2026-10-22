import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals'
import type { Memory } from '@mycogni/contracts'
import type { MemoryKind } from '@mycogni/domain'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { ShownMemory } from '../shown-memory'
import { MemoryBoard, undoWindow, type MemoryActions } from './memory-board'

const walk: ShownMemory = {
  id: '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10',
  content: 'Caminhar ajuda a se acalmar.',
  kind: 'coping',
  status: 'active',
  hint: 'De um registro de 15 de out.',
}

const breathe: ShownMemory = {
  id: '5e0b3941-50e6-4a0b-8c2b-0a9c193e1a09',
  content: 'Respirar devagar antes de reuniões acalma.',
  kind: 'coping',
  status: 'active',
  hint: 'De uma conversa',
}

const sister: ShownMemory = {
  id: '7a2d5b63-72a8-4d2c-8e4d-2c1e3b5a3b21',
  content: 'A irmã é uma pessoa importante.',
  kind: 'relationship',
  status: 'active',
  hint: 'De uma conversa',
}

const sunday: ShownMemory = {
  id: '9d4e7f86-a5db-4a5f-9b7a-5f4b6e8d6e54',
  content: 'Domingo à noite pesa.',
  kind: 'trigger',
  status: 'active',
  hint: null,
}

const old: ShownMemory = {
  id: '8b3e6c74-83b9-4e3d-9f5e-3d2f4c6b4c32',
  content: 'Trabalhava à noite.',
  kind: 'routine',
  status: 'archived',
  hint: 'Do MyBook',
}

function saved(content: string, kind: MemoryKind = 'fact', id = crypto.randomUUID()): Memory {
  return {
    id,
    content,
    kind,
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
      .fn<(content: string, kind: MemoryKind) => Promise<ActionResult<Memory>>>()
      .mockImplementation((content, kind) =>
        Promise.resolve({ ok: true, value: saved(content, kind) }),
      ),
    edit: jest
      .fn<(id: string, content: string) => Promise<ActionResult<Memory>>>()
      .mockImplementation((id, content) =>
        Promise.resolve({ ok: true, value: saved(content, 'coping', id) }),
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

function renderBoard(
  initial: readonly ShownMemory[],
  fake = actions(),
  user = userEvent.setup(),
  forgotten = true,
) {
  const forget = jest.fn<(id: string) => Promise<boolean>>().mockResolvedValue(forgotten)
  const view = renderWithIntl(
    <MemoryBoard
      title="Memórias"
      intro={<p>Introdução</p>}
      initial={initial}
      actions={fake}
      forget={forget}
    />,
  )
  return { fake, forget, user, view }
}

async function hidePage(): Promise<void> {
  const visibility = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
  })
  visibility.mockRestore()
}

function timedUser() {
  jest.useFakeTimers()
  return userEvent.setup({
    advanceTimers: (ms) => {
      jest.advanceTimersByTime(ms)
    },
  })
}

function options(memory: ShownMemory): HTMLElement {
  return screen.getByRole('button', { name: `Opções: ${memory.content}` })
}

const scrolled = jest.fn<(options?: boolean | ScrollIntoViewOptions) => void>()

beforeAll(() => {
  Element.prototype.scrollIntoView = scrolled
})

afterEach(() => {
  jest.useRealTimers()
})

describe('MemoryBoard', () => {
  it('groups the memories by kind, counts them and keeps old ones folded', () => {
    renderBoard([sunday, walk, sister, breathe, old])

    expect(screen.getByRole('heading', { level: 1, name: 'Memórias' })).toBeVisible()
    expect(screen.getAllByRole('heading', { level: 2 }).map((title) => title.textContent)).toEqual([
      'O que ajuda · 2',
      'Pessoas · 1',
      'O que pesa · 1',
    ])
    const helps = screen.getByRole('list', { name: 'O que ajuda' })
    expect(
      within(helps)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([`${walk.content}${walk.hint ?? ''}`, `${breathe.content}${breathe.hint ?? ''}`])
    expect(
      within(screen.getByRole('list', { name: 'O que pesa' })).getByRole('listitem'),
    ).toHaveTextContent(/^Domingo à noite pesa\.$/)
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.getByText('Memórias antigas · 1')).toBeVisible()
    expect(screen.getByText(old.content)).not.toBeVisible()
  })

  it('says when nothing is kept and offers only adding', () => {
    renderBoard([])

    expect(screen.getByText('Nada guardado ainda.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Adicionar memória' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Mais opções' })).not.toBeInTheDocument()
  })

  it('adds a memory of the chosen kind to its group and highlights it', async () => {
    const { fake, user } = renderBoard([walk])
    const add = screen.getByRole('button', { name: 'Adicionar memória' })

    await user.click(add)
    expect(screen.queryByText('Nada guardado ainda.')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Nova memória'), 'Quero correr 5 km até dezembro.')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'Objetivos')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(fake.add).toHaveBeenCalledWith('Quero correr 5 km até dezembro.', 'goal')
    const goals = await screen.findByRole('list', { name: 'Objetivos' })
    const added = within(goals).getByRole('listitem')
    expect(added).toHaveTextContent('Quero correr 5 km até dezembro.Adicionada por você')
    expect(added).toHaveClass('bg-emphasis/12')
    expect(scrolled).toHaveBeenCalledWith({ block: 'nearest' })
    expect(screen.queryByLabelText('Nova memória')).not.toBeInTheDocument()
    expect(add).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('Memória salva.')
  })

  it('lets the highlight of a new memory fade', async () => {
    const user = timedUser()
    renderBoard([], actions(), user)

    await user.click(screen.getByRole('button', { name: 'Adicionar memória' }))
    await user.type(screen.getByLabelText('Nova memória'), 'Gosto de chá.')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    const added = await screen.findByRole('listitem')
    expect(added).toHaveClass('bg-emphasis/12')

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(added).not.toHaveClass('bg-emphasis/12')
  })

  it('closes the composer without saving', async () => {
    const { fake, user } = renderBoard([walk])

    await user.click(screen.getByRole('button', { name: 'Adicionar memória' }))
    await user.type(screen.getByLabelText('Nova memória'), 'Rascunho')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(fake.add).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Nova memória')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar memória' })).toHaveFocus()
  })

  it('edits a memory in place and keeps its source', async () => {
    const { fake, user } = renderBoard([walk])

    await user.click(options(walk))
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    const field = screen.getByLabelText('Memória')
    await user.clear(field)
    await user.type(field, 'Caminhar à tarde ajuda a se acalmar.')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(fake.edit).toHaveBeenCalledWith(walk.id, 'Caminhar à tarde ajuda a se acalmar.')
    expect(await screen.findByText('Caminhar à tarde ajuda a se acalmar.')).toBeVisible()
    expect(screen.getByText('De um registro de 15 de out.')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Memória atualizada.')
  })

  it('deletes a memory at once and brings it back with undo', async () => {
    const user = timedUser()
    const { fake } = renderBoard([walk, breathe, sister], actions(), user)

    await user.click(options(walk))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))

    expect(screen.queryByText(walk.content)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'O que ajuda · 1' })).toBeVisible()
    expect(options(breathe)).toHaveFocus()
    const toast = screen.getByRole('status')
    expect(toast).toHaveTextContent('Memória apagada')
    await user.click(within(toast).getByRole('button', { name: 'Desfazer' }))

    const helps = screen.getByRole('list', { name: 'O que ajuda' })
    expect(within(helps).getAllByRole('listitem')[0]).toHaveTextContent(walk.content)
    expect(options(walk)).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Desfazer' })).not.toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(undoWindow * 2)
    })
    expect(fake.remove).not.toHaveBeenCalled()
  })

  it('deletes for good once the undo window passes', async () => {
    const user = timedUser()
    const { fake } = renderBoard([walk, sister], actions(), user)

    await user.click(options(sister))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    act(() => {
      jest.advanceTimersByTime(undoWindow - 100)
    })
    expect(fake.remove).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(fake.remove).toHaveBeenCalledWith(sister.id)
    expect(screen.queryByRole('button', { name: 'Desfazer' })).not.toBeInTheDocument()
    expect(screen.queryByText(sister.content)).not.toBeInTheDocument()
  })

  it('keeps the undo while the person is on it', async () => {
    const user = timedUser()
    const { fake } = renderBoard([walk, sister], actions(), user)

    await user.click(options(sister))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    act(() => {
      screen.getByRole('button', { name: 'Desfazer' }).focus()
    })
    act(() => {
      jest.advanceTimersByTime(undoWindow * 3)
    })

    expect(fake.remove).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Desfazer' })).toBeVisible()
  })

  it('deletes the previous memory for good when another one is deleted', async () => {
    const user = timedUser()
    const { fake } = renderBoard([walk, sister], actions(), user)

    await user.click(options(walk))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    await user.click(options(sister))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))

    expect(fake.remove).toHaveBeenCalledTimes(1)
    expect(fake.remove).toHaveBeenCalledWith(walk.id)
    expect(screen.getByText('Nada guardado ainda.')).toBeVisible()
  })

  it('still deletes when the person leaves for another page', async () => {
    const { fake, forget, user, view } = renderBoard([walk, sister])

    await user.click(options(walk))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    view.unmount()

    expect(fake.remove).toHaveBeenCalledWith(walk.id)
    expect(forget).not.toHaveBeenCalled()
  })

  it('deletes with a request that outlives the page when it is hidden', async () => {
    const { fake, forget, user } = renderBoard([walk, sister])

    await user.click(options(sister))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    await hidePage()

    expect(forget).toHaveBeenCalledWith(sister.id)
    expect(fake.remove).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Desfazer' })).not.toBeInTheDocument()
    expect(screen.queryByText(sister.content)).not.toBeInTheDocument()
  })

  it('brings the memory back when the request from a hidden page fails', async () => {
    const { user } = renderBoard([walk, sister], actions(), userEvent.setup(), false)

    await user.click(options(sister))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    await hidePage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos apagar agora. Tente de novo em instantes.',
    )
    expect(screen.getByText(sister.content)).toBeVisible()
  })

  it('brings the memory back and explains when the delete fails', async () => {
    const user = timedUser()
    renderBoard(
      [walk, sister],
      actions({ remove: () => Promise.resolve({ ok: false, error: 'Não deu para apagar.' }) }),
      user,
    )

    await user.click(options(sister))
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))
    act(() => {
      jest.advanceTimersByTime(undoWindow)
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para apagar.')
    expect(screen.getByText(sister.content)).toBeVisible()
  })

  it('asks before deleting everything from the header menu', async () => {
    const { fake, user } = renderBoard([walk, sister, old])
    const more = screen.getByRole('button', { name: 'Mais opções' })

    await user.click(more)
    await user.click(screen.getByRole('menuitem', { name: 'Apagar todas' }))
    const confirm = screen.getByRole('alertdialog', { name: 'Apagar todas as memórias?' })
    expect(confirm).toHaveAccessibleDescription(
      'O Cogni esquece tudo o que guardou. Não dá para desfazer.',
    )
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(more).toHaveFocus()
    expect(fake.clear).not.toHaveBeenCalled()

    await user.click(more)
    await user.click(screen.getByRole('menuitem', { name: 'Apagar todas' }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Apagar todas' }),
    )

    expect(fake.clear).toHaveBeenCalled()
    expect(await screen.findByText('Nada guardado ainda.')).toBeVisible()
    expect(screen.queryByText('Memórias antigas · 1')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Memórias apagadas.')
  })

  it('speaks European Portuguese', () => {
    renderWithIntl(<MemoryBoard title="Memórias" initial={[walk]} actions={actions()} />, {
      locale: 'pt-PT',
    })

    expect(screen.getByRole('heading', { level: 2, name: 'O que ajuda · 1' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Adicionar memória' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Mais opções' })).toBeVisible()
  })

  it('speaks English', () => {
    renderWithIntl(<MemoryBoard title="Memories" initial={[sister]} actions={actions()} />, {
      locale: 'en-US',
    })

    expect(screen.getByRole('list', { name: 'People' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Add a memory' })).toBeVisible()
    expect(screen.getByRole('button', { name: `Options: ${sister.content}` })).toBeVisible()
  })
})
