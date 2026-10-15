import { describe, expect, it } from '@jest/globals'
import type { MoodDay } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { RecentMood } from './recent-mood'

function daysOf(averages: readonly (number | null)[]): MoodDay[] {
  return averages.map((average, index) => ({
    day: `2026-10-${String(index + 2).padStart(2, '0')}`,
    average,
    count: average === null ? 0 : 1,
  }))
}

const fortnight = daysOf([3, 3, 3, null, 3, 3, 3, 4, 4, null, 3, 4, null, 4])

describe('RecentMood', () => {
  it('sums up the last week against the one before in plain words', () => {
    renderWithIntl(<RecentMood days={fortnight} />)

    const section = screen.getByRole('region', { name: 'Últimos 14 dias' })
    expect(section).toHaveTextContent(
      'Nos últimos 7 dias, seu humor médio foi 3,8 de 6 (um pouco bem). Acima da semana anterior (3,0).',
    )
    expect(section).toHaveTextContent('11 de 14 dias com registro.')
  })

  it('does not compare with a week that has too few records', () => {
    renderWithIntl(
      <RecentMood days={daysOf([3, null, null, null, null, null, null, 2, 3, null, 3, 2, 1, 2])} />,
    )

    expect(
      screen.getByText('Nos últimos 7 dias, seu humor médio foi 2,2 de 6 (um pouco mal).'),
    ).toBeInTheDocument()
  })

  it('says when the last week has no records', () => {
    renderWithIntl(<RecentMood days={daysOf([4, 5, ...Array.from({ length: 12 }, () => null)])} />)

    expect(screen.getByText('Nenhum registro nos últimos 7 dias.')).toBeInTheDocument()
  })

  it('invites the first records instead of an empty chart', () => {
    renderWithIntl(<RecentMood days={daysOf(Array.from({ length: 14 }, () => null))} />)

    expect(screen.getByText('Seus dias aparecem aqui conforme você registra.')).toBeInTheDocument()
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('draws one mark per recorded day, with today stressed, and keeps a table of the values', () => {
    const { container } = renderWithIntl(<RecentMood days={fortnight} />)

    expect(container.querySelectorAll('[data-day]')).toHaveLength(11)
    expect(container.querySelector('[data-day="2026-10-15"]')).toHaveClass('size-3.5')
    const table = screen.getByRole('table', { name: 'Humor médio de cada dia nos últimos 14 dias' })
    expect(within(table).getAllByRole('row')).toHaveLength(15)
    expect(
      within(table).getByRole('row', { name: /quarta-feira, 14 de outubro/ }),
    ).toHaveTextContent('Sem registro')
  })

  it('reads each day with the keyboard', async () => {
    const user = userEvent.setup()
    renderWithIntl(<RecentMood days={fortnight} />)

    await user.tab()
    const chart = screen.getByRole('group', { name: 'Humor médio de cada dia nos últimos 14 dias' })
    expect(chart).toHaveFocus()
    expect(chart).toHaveAccessibleDescription(/15 de out.*4,0 Um pouco bem.*1 registro/)

    await user.keyboard('{ArrowLeft}')
    expect(chart).toHaveAccessibleDescription(/14 de out.*Sem registro/)

    await user.keyboard('{Home}')
    expect(chart).toHaveAccessibleDescription(/2 de out.*3,0 Neutro/)
  })

  it('speaks English', () => {
    renderWithIntl(<RecentMood days={fortnight} />, { locale: 'en-US' })

    expect(
      screen.getByText(
        'Over the last 7 days, your average mood was 3.8 out of 6 (slightly good). Higher than the week before (3.0).',
      ),
    ).toBeInTheDocument()
  })
})
