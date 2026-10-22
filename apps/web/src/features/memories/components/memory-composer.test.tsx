import { describe, expect, it, jest } from '@jest/globals'
import type { MemoryKind } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { MemoryComposer } from './memory-composer'

function renderComposer(error: string | null = null, locale: 'pt-BR' | 'en-US' = 'pt-BR') {
  const onSave = jest.fn<(content: string, kind: MemoryKind) => void>()
  const onCancel = jest.fn<() => void>()
  renderWithIntl(
    <MemoryComposer pending={false} error={error} onSave={onSave} onCancel={onCancel} />,
    { locale },
  )
  return { onSave, onCancel, user: userEvent.setup() }
}

describe('MemoryComposer', () => {
  it('starts focused, about the person, with the eight kinds to choose from', () => {
    renderComposer()

    const field = screen.getByRole('textbox', { name: 'Nova memória' })
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('placeholder', 'Ex.: Caminhar me ajuda a desacelerar.')
    expect(field).toHaveAttribute('maxLength', '280')
    const kind = screen.getByRole('combobox', { name: 'Tipo' })
    expect(kind).toHaveDisplayValue('Sobre você')
    expect(
      within(kind)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'O que ajuda',
      'Rotina',
      'Pessoas',
      'Objetivos',
      'Do que você gosta',
      'O que pesa',
      'Momentos',
      'Sobre você',
    ])
  })

  it('saves the text with the chosen kind', async () => {
    const { onSave, user } = renderComposer()

    await user.type(screen.getByRole('textbox', { name: 'Nova memória' }), 'Gosto de jazz.')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSave).toHaveBeenLastCalledWith('Gosto de jazz.', 'fact')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'Do que você gosta')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSave).toHaveBeenLastCalledWith('Gosto de jazz.', 'preference')
  })

  it('cancels with the button or Escape', async () => {
    const { onCancel, onSave, user } = renderComposer()

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows why the memory could not be saved', () => {
    renderComposer('Escreva a memória.')

    expect(screen.getByRole('alert')).toHaveTextContent('Escreva a memória.')
    expect(screen.getByRole('textbox', { name: 'Nova memória' })).toHaveAccessibleDescription(
      'Escreva a memória.',
    )
  })

  it('speaks English', () => {
    renderComposer(null, 'en-US')

    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveDisplayValue('About you')
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible()
  })
})
