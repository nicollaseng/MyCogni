import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { activity } from '../test-data'
import { ActivityChart } from './activity-chart'

const counts = [...Array.from({ length: 27 }, () => 2), 0, 3, 5]

describe('ActivityChart', () => {
  it('describes the chart and reads each day out with the arrow keys', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ActivityChart activity={activity(counts)} />)

    const plot = screen.getByRole('group', {
      name: 'Registros por dia nos últimos 30 dias, 62 no total.',
    })
    plot.focus()
    await user.keyboard('{ArrowLeft}')

    expect(screen.getByRole('status')).toHaveTextContent('qui., 15 de out.')
    expect(screen.getByRole('status')).toHaveTextContent('5 registros')
    expect(screen.getByRole('status')).toHaveTextContent('3 pacientes')
    expect(screen.getByRole('status')).toHaveTextContent('Humor médio 3,5')

    await user.keyboard('{ArrowLeft}')

    expect(screen.getByRole('status')).toHaveTextContent('qua., 14 de out.')
    expect(screen.getByRole('status')).toHaveTextContent('3 registros')

    await user.keyboard('{ArrowLeft}')

    expect(screen.getByRole('status')).toHaveTextContent('Nenhum registro')
    expect(screen.getByRole('status')).toHaveTextContent('Sem registros de humor')
  })

  it('switches to the daily average mood on the same days', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ActivityChart activity={activity(counts)} />)

    await user.click(screen.getByRole('radio', { name: 'Humor médio' }))

    expect(
      screen.getByRole('group', { name: /Humor médio diário dos pacientes nos últimos 30 dias/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Muito bem')).toBeInTheDocument()
    expect(screen.getByText('Muito mal')).toBeInTheDocument()
  })

  it('offers the same numbers as a table', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ActivityChart activity={activity(counts)} />)

    await user.click(screen.getByText('Ver dados em tabela'))

    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(31)
    expect(rows.at(-1)).toHaveTextContent('qui., 15 de out.533,5')
  })

  it('says so when nobody recorded anything in the month', () => {
    renderWithIntl(<ActivityChart activity={activity(Array.from({ length: 30 }, () => 0))} />)

    expect(screen.getByText('Nenhum registro nos últimos 30 dias.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /nos últimos 30 dias/ })).not.toBeInTheDocument()
  })
})
