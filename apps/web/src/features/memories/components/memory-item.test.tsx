import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { ShownMemory } from '../shown-memory'
import { MemoryItem } from './memory-item'

const walk: ShownMemory = {
  id: '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10',
  content: 'Caminhar ajuda a se acalmar.',
  kind: 'coping',
  status: 'active',
  hint: 'De uma conversa',
}

function renderItem(
  edit = jest
    .fn<(id: string, content: string) => Promise<ActionResult<ShownMemory>>>()
    .mockImplementation((id, content) =>
      Promise.resolve({ ok: true, value: { ...walk, id, content } }),
    ),
) {
  const onEdited = jest.fn<(memory: ShownMemory) => void>()
  const onRemove = jest.fn<(memory: ShownMemory) => void>()
  renderWithIntl(
    <ul>
      <MemoryItem memory={walk} edit={edit} onEdited={onEdited} onRemove={onRemove} />
    </ul>,
  )
  return { edit, onEdited, onRemove, user: userEvent.setup() }
}

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: `Opções: ${walk.content}` })
}

describe('MemoryItem', () => {
  it('shows the text, where it came from and one menu button', () => {
    renderItem()

    expect(screen.getByRole('listitem')).toHaveTextContent(
      'Caminhar ajuda a se acalmar.De uma conversa',
    )
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: /Editar|Apagar/ })).not.toBeInTheDocument()
  })

  it('opens its menu from the keyboard and moves between the options', async () => {
    const { user } = renderItem()

    trigger().focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menu', { name: `Opções: ${walk.content}` })).toBeVisible()
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Apagar' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Apagar' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(trigger()).toHaveFocus()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('edits the text in place and returns to the menu button', async () => {
    const { edit, onEdited, user } = renderItem()

    await user.click(trigger())
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    const field = screen.getByRole('textbox', { name: 'Memória' })
    expect(field).toHaveValue(walk.content)
    expect(field).toHaveFocus()
    expect(field).toHaveProperty('selectionStart', walk.content.length)
    expect(field).toHaveAttribute('maxLength', '280')
    expect(screen.queryByText('De uma conversa')).not.toBeInTheDocument()

    await user.type(field, ' Todo dia.')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(edit).toHaveBeenCalledWith(walk.id, 'Caminhar ajuda a se acalmar. Todo dia.')
    expect(onEdited).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: `Opções: ${walk.content}` })).toHaveFocus()
  })

  it('cancels the edit with Escape without saving', async () => {
    const { edit, user } = renderItem()

    await user.click(trigger())
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    await user.type(screen.getByRole('textbox', { name: 'Memória' }), ' rascunho')
    await user.keyboard('{Escape}')

    expect(edit).not.toHaveBeenCalled()
    expect(screen.getByText(walk.content)).toBeVisible()
    expect(trigger()).toHaveFocus()
  })

  it('shows why the edit could not be saved', async () => {
    const { user } = renderItem(
      jest
        .fn<(id: string, content: string) => Promise<ActionResult<ShownMemory>>>()
        .mockResolvedValue({ ok: false, error: 'Escreva a memória.' }),
    )

    await user.click(trigger())
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    await user.clear(screen.getByRole('textbox', { name: 'Memória' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Escreva a memória.')
    expect(screen.getByRole('textbox', { name: 'Memória' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('asks the board to delete it', async () => {
    const { onRemove, user } = renderItem()

    await user.click(trigger())
    await user.click(screen.getByRole('menuitem', { name: 'Apagar' }))

    expect(onRemove).toHaveBeenCalledWith(walk)
  })
})
