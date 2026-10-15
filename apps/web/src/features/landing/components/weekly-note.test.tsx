import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { WeeklyNote } from './weekly-note'

describe('WeeklyNote', () => {
  it('shows the week the summary is based on, day by day', () => {
    renderWithIntl(<WeeklyNote />)

    const table = screen.getByRole('table', { name: 'Humor e horas de sono de cada dia da semana' })
    const days = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent)

    expect(days.slice(1)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'])
  })

  it('writes sleep hours the way people read them in Brazil', () => {
    renderWithIntl(<WeeklyNote />)

    expect(screen.getAllByText('7,5 h')).toHaveLength(2)
    expect(screen.getByText('4,5 h')).toBeInTheDocument()
  })

  it('names the mood of each day for screen readers', () => {
    renderWithIntl(<WeeklyNote />)

    expect(screen.getAllByRole('cell', { name: 'Mal' })).toHaveLength(2)
  })

  it('makes clear that the AI only puts the numbers into words', () => {
    renderWithIntl(<WeeklyNote />)

    expect(screen.getByText(/a IA só\s+coloca em palavras/)).toBeInTheDocument()
  })

  it('follows the reader’s language, numbers and moods in British English', () => {
    renderWithIntl(<WeeklyNote />, { locale: 'en-GB' })

    const table = screen.getByRole('table', {
      name: 'Mood and hours of sleep for each day of the week',
    })

    expect(within(table).getAllByRole('columnheader')[1]).toHaveTextContent('Mon')
    expect(screen.getByText('weekly summary · 5–11 October')).toBeInTheDocument()
    expect(screen.getAllByText('7.5 h')).toHaveLength(2)
    expect(screen.getAllByRole('cell', { name: 'Bad' })).toHaveLength(2)
  })
})
