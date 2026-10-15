import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { noFilters, type EntryFilters as Filters } from '../filters'
import { EntryFilters } from './entry-filters'

function setup(filters: Filters = noFilters, locale: 'pt-BR' | 'en-US' = 'pt-BR') {
  const onChange = jest.fn<(next: Filters) => void>()
  const user = userEvent.setup()
  renderWithIntl(
    <EntryFilters
      filters={filters}
      usedEmotions={['anxiety', 'luto']}
      usedContexts={['work']}
      onChange={onChange}
    />,
    { locale },
  )
  return { onChange, user }
}

describe('EntryFilters', () => {
  it('searches when the person presses Enter', async () => {
    const { onChange, user } = setup({ ...noFilters, mood: 'good' })

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar nos registros' }),
      ' prazo {Enter}',
    )

    expect(onChange).toHaveBeenCalledWith({ ...noFilters, mood: 'good', q: 'prazo' })
  })

  it('clears the search and keeps the other filters', async () => {
    const { onChange, user } = setup({ ...noFilters, q: 'prazo', period: '7' })

    expect(screen.getByRole('searchbox')).toHaveValue('prazo')
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }))

    expect(onChange).toHaveBeenCalledWith({ ...noFilters, period: '7' })
  })

  it('narrows by period, mood and note', async () => {
    const { onChange, user } = setup()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Período' }), 'Últimos 30 dias')
    expect(onChange).toHaveBeenLastCalledWith({ ...noFilters, period: '30' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Humor' }), 'Humor difícil')
    expect(onChange).toHaveBeenLastCalledWith({ ...noFilters, mood: 'hard' })

    await user.click(screen.getByRole('checkbox', { name: 'Só com nota' }))
    expect(onChange).toHaveBeenLastCalledWith({ ...noFilters, withNote: true })
  })

  it('offers the person own tags first, then the whole catalog in their language', async () => {
    const { onChange, user } = setup()
    const emotion = screen.getByRole('combobox', { name: 'Emoção' })

    const yours = within(emotion).getByRole('group', { name: 'Suas mais usadas' })
    expect(
      within(yours)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['ansiedade', 'luto'])
    expect(within(emotion).getByRole('group', { name: 'tristeza' })).toBeInTheDocument()

    await user.selectOptions(emotion, 'luto')
    expect(onChange).toHaveBeenLastCalledWith({ ...noFilters, emotion: 'luto' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Contexto' }), 'sono')
    expect(onChange).toHaveBeenLastCalledWith({ ...noFilters, context: 'sleep' })
  })

  it('shows the chosen filters and clears them all but the search', async () => {
    const { onChange, user } = setup({
      ...noFilters,
      q: 'chuva',
      mood: 'neutral',
      emotion: 'saudade de casa',
    })

    expect(screen.getByRole('combobox', { name: 'Humor' })).toHaveDisplayValue('Humor neutro')
    expect(screen.getByRole('combobox', { name: 'Emoção' })).toHaveDisplayValue('saudade de casa')
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(onChange).toHaveBeenCalledWith({ ...noFilters, q: 'chuva' })
  })

  it('has nothing to clear without filters', () => {
    setup({ ...noFilters, q: 'chuva' })

    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })

  it('speaks English', () => {
    setup(noFilters, 'en-US')

    expect(screen.getByRole('searchbox', { name: 'Search your entries' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Emotion' })).toHaveDisplayValue('All emotions')
    expect(screen.getAllByRole('option', { name: 'anxiety' })).toHaveLength(2)
  })
})
