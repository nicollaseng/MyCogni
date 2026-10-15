import { describe, expect, it } from '@jest/globals'
import { previousDays } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import type { MoodDay } from '../mood-days'
import { MoodChart } from './mood-chart'

function days(values: readonly (number | null)[]): MoodDay[] {
  return previousDays('2026-10-15', values.length).map((day, index) => {
    const average = values[index] ?? null
    return { day, average, count: average === null ? 0 : 2 }
  })
}

describe('MoodChart', () => {
  it('describes the month and reads the day under the cursor', async () => {
    const user = userEvent.setup()
    renderWithIntl(<MoodChart days={days([null, 4, 2.4])} />)

    const plot = screen.getByRole('group', { name: /2 dias com registro/ })
    plot.focus()
    await user.keyboard('{ArrowLeft}')

    expect(screen.getByRole('status')).toHaveTextContent('qui., 15 de out.')
    expect(screen.getByRole('status')).toHaveTextContent('Humor médio 2,4')
    expect(screen.getByRole('status')).toHaveTextContent('Um pouco mal')
    expect(screen.getByRole('status')).toHaveTextContent('2 registros')

    await user.keyboard('{Home}')

    expect(screen.getByRole('status')).toHaveTextContent('Nenhum registro')
  })

  it('lists only the days with entries in the table view', async () => {
    const user = userEvent.setup()
    renderWithIntl(<MoodChart days={days([null, 4, 2.5])} />)

    await user.click(screen.getByText('Ver dados em tabela'))

    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3)
  })

  it('says so when there is no entry in the month', () => {
    renderWithIntl(<MoodChart days={days([null, null])} />)

    expect(screen.getByText('Nenhum registro de humor nos últimos 2 dias.')).toBeInTheDocument()
  })
})
