import { describe, expect, it } from '@jest/globals'
import { render, screen, within } from '@testing-library/react'
import { WeeklyNote } from './weekly-note'

describe('WeeklyNote', () => {
  it('shows the week the summary is based on, day by day', () => {
    render(<WeeklyNote />)

    const table = screen.getByRole('table', { name: 'Humor e horas de sono de cada dia da semana' })
    const days = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent)

    expect(days.slice(1)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'])
  })

  it('writes sleep hours the way people read them in Brazil', () => {
    render(<WeeklyNote />)

    expect(screen.getAllByText('7,5 h')).toHaveLength(2)
    expect(screen.getByText('4,5 h')).toBeInTheDocument()
  })

  it('names the mood of each day for screen readers', () => {
    render(<WeeklyNote />)

    expect(screen.getAllByRole('cell', { name: 'Mal' })).toHaveLength(2)
  })

  it('makes clear that the AI only puts the numbers into words', () => {
    render(<WeeklyNote />)

    expect(screen.getByText(/a IA só\s+coloca em palavras/)).toBeInTheDocument()
  })
})
