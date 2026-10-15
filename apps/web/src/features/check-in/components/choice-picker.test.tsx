import { describe, expect, it, jest } from '@jest/globals'
import type { Locale } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { renderWithIntl } from '@/test/render'
import type { ChoiceGroup } from '../catalog'
import { ChoicePicker } from './choice-picker'

const tabs: readonly ChoiceGroup[] = [
  {
    id: 'suggestions',
    title: 'sugestões',
    items: [
      { id: 'anxiety', label: 'ansiedade' },
      { id: 'tiredness', label: 'cansaço' },
    ],
  },
  {
    id: 'sadness',
    title: 'tristeza',
    items: [
      { id: 'sadness', label: 'tristeza' },
      { id: 'loneliness', label: 'solidão' },
      { id: 'longing', label: 'saudade' },
    ],
  },
  {
    id: 'calm',
    title: 'calma',
    items: [
      { id: 'calm', label: 'calma' },
      { id: 'worry', label: 'preocupação' },
    ],
  },
]

function Harness({ onToggle }: { onToggle?: (item: string) => void }) {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <ChoicePicker
      tabs={tabs}
      selected={selected}
      searchLabel="Buscar ou escrever outra"
      onToggle={(item) => {
        onToggle?.(item)
        setSelected((current) =>
          current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
        )
      }}
    />
  )
}

function renderPicker({
  locale,
  onToggle,
}: { locale?: Locale; onToggle?: (item: string) => void } = {}) {
  return renderWithIntl(<Harness onToggle={onToggle} />, { locale })
}

function chips(): string[] {
  return Array.from(
    screen.getByRole('tabpanel').querySelectorAll('button'),
    (button) => button.textContent,
  )
}

describe('ChoicePicker', () => {
  it('opens on the suggestions without showing everything at once', () => {
    renderPicker()

    expect(screen.getByRole('tab', { name: 'sugestões' })).toHaveAttribute('aria-selected', 'true')
    expect(chips()).toEqual(['ansiedade', 'cansaço'])
  })

  it('swaps the options in place when another group is chosen', async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.click(screen.getByRole('tab', { name: 'tristeza' }))

    expect(chips()).toEqual(['tristeza', 'solidão', 'saudade'])
  })

  it('keeps choices from different groups and lists them by name', async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.click(screen.getByRole('button', { name: 'ansiedade' }))
    await user.click(screen.getByRole('tab', { name: 'tristeza' }))
    await user.click(screen.getByRole('button', { name: 'solidão' }))

    expect(screen.getByRole('button', { name: 'solidão' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('ansiedade, solidão')).toBeInTheDocument()
  })

  it('hands back the catalog id of a chosen option', async () => {
    const user = userEvent.setup()
    const onToggle = jest.fn<(item: string) => void>()
    renderPicker({ onToggle })

    await user.click(screen.getByRole('button', { name: 'cansaço' }))

    expect(onToggle).toHaveBeenCalledWith('tiredness')
  })

  it('finds any option by name, ignoring accents', async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar ou escrever outra' }),
      'preocupacao',
    )

    expect(chips()).toContain('preocupação')
  })

  it('picks the catalog option when its name is typed in full', async () => {
    const user = userEvent.setup()
    const onToggle = jest.fn<(item: string) => void>()
    renderPicker({ onToggle })

    await user.type(screen.getByRole('searchbox'), 'Preocupacao{Enter}')

    expect(onToggle).toHaveBeenCalledWith('worry')
    expect(screen.getByText('preocupação', { selector: 'span' })).toBeInTheDocument()
  })

  it('lets the person add a word that is not in the list', async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar ou escrever outra' }),
      'Luto{Enter}',
    )

    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'luto' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers to create a word while it is being typed', async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.type(screen.getByRole('searchbox'), 'luto')
    await user.click(screen.getByRole('button', { name: 'Adicionar luto' }))

    expect(screen.getByText('luto', { selector: 'span' })).toBeInTheDocument()
  })

  it('speaks the language of the person', async () => {
    const user = userEvent.setup()
    renderPicker({ locale: 'en-US' })

    await user.click(screen.getByRole('button', { name: 'ansiedade' }))
    await user.type(screen.getByRole('searchbox'), 'grief')

    expect(screen.getByRole('button', { name: 'Add grief' })).toBeInTheDocument()
    expect(screen.getByText('Selected:', { exact: false })).toHaveTextContent('Selected: ansiedade')
  })
})
