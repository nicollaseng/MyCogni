import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { ChoiceGroup } from '../catalog'
import { ChoicePicker } from './choice-picker'

const tabs: readonly ChoiceGroup[] = [
  { id: 'suggestions', title: 'sugestões', items: ['ansiedade', 'cansaço'] },
  { id: 'sadness', title: 'tristeza', items: ['tristeza', 'solidão', 'saudade'] },
  { id: 'calm', title: 'calma', items: ['calma', 'preocupação'] },
]

function Harness() {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <ChoicePicker
      tabs={tabs}
      selected={selected}
      searchLabel="Buscar ou escrever outra"
      onToggle={(item) => {
        setSelected((current) =>
          current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
        )
      }}
    />
  )
}

function chips(): string[] {
  return Array.from(
    screen.getByRole('tabpanel').querySelectorAll('button'),
    (button) => button.textContent,
  )
}

describe('ChoicePicker', () => {
  it('opens on the suggestions without showing everything at once', () => {
    render(<Harness />)

    expect(screen.getByRole('tab', { name: 'sugestões' })).toHaveAttribute('aria-selected', 'true')
    expect(chips()).toEqual(['ansiedade', 'cansaço'])
  })

  it('swaps the options in place when another group is chosen', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('tab', { name: 'tristeza' }))

    expect(chips()).toEqual(['tristeza', 'solidão', 'saudade'])
  })

  it('keeps choices from different groups and lists them', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'ansiedade' }))
    await user.click(screen.getByRole('tab', { name: 'tristeza' }))
    await user.click(screen.getByRole('button', { name: 'solidão' }))

    expect(screen.getByRole('button', { name: 'solidão' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('ansiedade, solidão')).toBeInTheDocument()
  })

  it('finds any option by name, ignoring accents', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar ou escrever outra' }),
      'preocupacao',
    )

    expect(chips()).toContain('preocupação')
  })

  it('lets the person add a word that is not in the list', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar ou escrever outra' }),
      'Luto{Enter}',
    )

    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'luto' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers to create a word while it is being typed', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('searchbox'), 'luto')
    await user.click(screen.getByRole('button', { name: 'Adicionar luto' }))

    expect(screen.getByText('luto', { selector: 'span' })).toBeInTheDocument()
  })
})
