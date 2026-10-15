import { describe, expect, it } from '@jest/globals'
import type { CheckIn } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { testTimeZone } from '../test-data'
import { CheckInTable } from './check-in-table'

function checkIn(day: number, overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: `0b7c6c8e-6a8f-4f53-9f4b-${String(day).padStart(12, '0')}`,
    moodLevel: 3,
    emotions: [],
    contexts: [],
    note: null,
    recordedAt: `2026-10-${String(day).padStart(2, '0')}T20:15:00Z`,
    ...overrides,
  }
}

const walk = checkIn(14, {
  moodLevel: 5,
  emotions: ['calm', 'gratitude'],
  contexts: ['exercise'],
  note: 'Caminhei antes do trabalho e o dia rendeu.',
})
const quiet = checkIn(13, { moodLevel: 1, emotions: ['sadness'] })
const older = Array.from({ length: 12 }, (_, index) => checkIn(index + 1))

function renderTable(checkIns: readonly CheckIn[]) {
  const user = userEvent.setup()
  renderWithIntl(<CheckInTable checkIns={checkIns} timeZone={testTimeZone} days={30} />)
  return { user }
}

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole('row').slice(1)
}

describe('CheckInTable', () => {
  it('lists the newest entries first with mood, translated tags and the note', () => {
    renderTable([quiet, walk])

    const [first, second] = bodyRows()
    if (first === undefined || second === undefined) {
      throw new Error('Expected two entries')
    }
    expect(first).toHaveTextContent('qua., 14 de out. · 17:15')
    expect(within(first).getByText('Bem')).toBeInTheDocument()
    expect(within(first).getByRole('list', { name: 'Emoções' })).toHaveTextContent('calmagratidão')
    expect(within(first).getByRole('list', { name: 'Contextos' })).toHaveTextContent('exercício')
    expect(
      within(first).getByRole('button', { name: 'Caminhei antes do trabalho e o dia rendeu.' }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(within(second).getByText('Mal')).toBeInTheDocument()
  })

  it('opens a long note in place', async () => {
    const { user } = renderTable([walk])
    const note = screen.getByRole('button', { name: 'Caminhei antes do trabalho e o dia rendeu.' })

    await user.click(note)

    expect(note).toHaveAttribute('aria-expanded', 'true')
  })

  it('pages through long months and keeps only notes when asked, back on the first page', async () => {
    const { user } = renderTable([walk, quiet, ...older])

    expect(screen.getByText('14 registros')).toBeInTheDocument()
    expect(screen.getByText('1–12 de 14')).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(12)

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))

    expect(screen.getByText('13–14 de 14')).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(2)

    await user.click(screen.getByRole('checkbox', { name: 'Só com nota' }))

    expect(screen.getByText('1 registro')).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(1)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('says so when there is nothing to show', async () => {
    const { user } = renderTable([quiet])

    await user.click(screen.getByRole('checkbox', { name: 'Só com nota' }))

    expect(screen.getByText('Nenhum registro com nota nos últimos 30 dias.')).toBeInTheDocument()
  })
})
