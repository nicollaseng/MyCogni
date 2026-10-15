import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { renderWithIntl } from '@/test/render'
import { noFilters, type EntryFilters as Filters } from '../filters'
import { EntryFilters, type FilterChange } from './entry-filters'

type Recorder = jest.Mock<(next: Filters, change: FilterChange) => void>

function Harness({ initial, record }: { initial: Filters; record: Recorder }) {
  const [filters, setFilters] = useState(initial)
  return (
    <EntryFilters
      filters={filters}
      customEmotions={['luto']}
      customContexts={[]}
      total={12}
      onChange={(next, change) => {
        record(next, change)
        setFilters(next)
      }}
    />
  )
}

function setup(initial: Filters = noFilters, locale: 'pt-BR' | 'en-US' = 'pt-BR') {
  const record: Recorder = jest.fn()
  const user = userEvent.setup()
  renderWithIntl(<Harness initial={initial} record={record} />, { locale })
  return { record, user }
}

function desktopScreen() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === '(min-width: 640px)',
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia')
})

describe('EntryFilters', () => {
  it('keeps search and filters on one row and searches when the person presses Enter', async () => {
    const { record, user } = setup()

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar nos registros' }),
      ' prazo {Enter}',
    )

    expect(record).toHaveBeenLastCalledWith({ ...noFilters, q: 'prazo' }, 'push')
  })

  it('clears the search and keeps the other filters', async () => {
    const { record, user } = setup({ ...noFilters, q: 'prazo', period: '7' })

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }))

    expect(record).toHaveBeenLastCalledWith({ ...noFilters, period: '7' }, 'push')
  })

  it('shows how many filters are on and sums them up in one quiet line', async () => {
    const { record, user } = setup({
      ...noFilters,
      q: 'chuva',
      period: '30',
      mood: { min: 0, max: 1 },
      contexts: ['work'],
    })

    expect(screen.getByRole('button', { name: /^Filtros/ })).toHaveAccessibleName(
      'Filtros, 3 ativos',
    )
    expect(screen.getByText('Últimos 30 dias · Humor muito mal a mal · Trabalho')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Limpar' }))

    expect(record).toHaveBeenLastCalledWith({ ...noFilters, q: 'chuva' }, 'push')
    expect(screen.queryByText(/Últimos 30 dias/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filtros/ })).toHaveAccessibleName(
      'Filtros, nenhum ativo',
    )
  })

  it('opens a sheet on small screens where period, mood and note narrow the list', async () => {
    const { record, user } = setup()

    await user.click(screen.getByRole('button', { name: /^Filtros/ }))
    const sheet = screen.getByRole('dialog', { name: 'Filtros' })

    await user.click(within(sheet).getByRole('radio', { name: '30 dias' }))
    expect(record).toHaveBeenLastCalledWith({ ...noFilters, period: '30' }, 'push')

    const scale = within(sheet).getByRole('group', { name: 'Humor' })
    await user.click(within(scale).getByRole('button', { name: 'Mal' }))
    await user.click(within(scale).getByRole('button', { name: 'Muito mal' }))
    expect(within(scale).getByRole('button', { name: 'Muito mal' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(sheet).getByText('Humor muito mal a mal')).toBeVisible()

    await user.click(within(sheet).getByRole('checkbox', { name: 'Só com nota' }))
    expect(record).toHaveBeenLastCalledWith(
      { ...noFilters, period: '30', mood: { min: 0, max: 1 }, withNote: true },
      'replace',
    )

    await user.click(within(sheet).getByRole('button', { name: 'Ver 12 registros' }))
    expect(
      await screen.findByText('Últimos 30 dias · Humor muito mal a mal · Com nota'),
    ).toBeVisible()
  })

  it('finds emotions and contexts by name, grouped by family, with the person own words first', async () => {
    const { record, user } = setup()

    await user.click(screen.getByRole('button', { name: /^Filtros/ }))
    const sheet = screen.getByRole('dialog', { name: 'Filtros' })
    await user.click(within(sheet).getByRole('button', { name: /^Emoções/ }))

    expect(within(sheet).getByRole('group', { name: 'Suas' })).toHaveTextContent('luto')
    expect(within(sheet).getByRole('group', { name: 'tristeza' })).toBeInTheDocument()

    await user.type(within(sheet).getByRole('searchbox', { name: 'Buscar emoção' }), 'ansi')
    expect(within(sheet).queryByRole('group', { name: 'tristeza' })).not.toBeInTheDocument()
    await user.click(within(sheet).getByRole('checkbox', { name: 'ansiedade' }))
    expect(record).toHaveBeenLastCalledWith({ ...noFilters, emotions: ['anxiety'] }, 'push')
    expect(within(sheet).getByRole('button', { name: /^Emoções/ })).toHaveTextContent('ansiedade')

    await user.clear(within(sheet).getByRole('searchbox', { name: 'Buscar emoção' }))
    await user.type(within(sheet).getByRole('searchbox', { name: 'Buscar emoção' }), 'xyz')
    expect(within(sheet).getByText('Nenhuma emoção com esse nome.')).toBeVisible()

    await user.click(within(sheet).getByRole('button', { name: /^Contextos/ }))
    await user.click(within(sheet).getByRole('checkbox', { name: 'trabalho' }))
    expect(record).toHaveBeenLastCalledWith(
      { ...noFilters, emotions: ['anxiety'], contexts: ['work'] },
      'replace',
    )
  })

  it('clears everything but the search from inside the panel', async () => {
    const { record, user } = setup({ ...noFilters, q: 'chuva', withNote: true })

    await user.click(screen.getByRole('button', { name: /^Filtros/ }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Filtros' })).getByRole('button', {
        name: 'Limpar',
      }),
    )

    expect(record).toHaveBeenLastCalledWith({ ...noFilters, q: 'chuva' }, 'push')
  })

  it('opens a panel under the button on larger screens and closes it with Escape', async () => {
    desktopScreen()
    const { user } = setup()
    const button = screen.getByRole('button', { name: /^Filtros/ })

    await user.click(button)
    const panel = screen.getByRole('dialog', { name: 'Filtros' })
    expect(panel).not.toHaveAttribute('aria-modal')
    expect(button).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it('speaks English', () => {
    setup({ ...noFilters, period: '7', mood: { min: 5, max: 5 }, withNote: true }, 'en-US')

    expect(screen.getByText('Last 7 days · Mood good · With a note')).toBeVisible()
  })
})
