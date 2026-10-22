import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { ZenStatsTable } from './zen-stats-table'

describe('ZenStatsTable', () => {
  it('shows aggregated numbers and a dash wherever a group is too small', () => {
    renderWithIntl(
      <ZenStatsTable
        rows={[
          {
            key: 'meditation:anxiety',
            kindLabel: 'Meditação',
            title: 'Quando a ansiedade aperta',
            stats: {
              kind: 'meditation',
              contentId: 'anxiety',
              people: 12,
              starts: 20,
              completions: 15,
              medianSeconds: 300,
              comparedPeople: 6,
              better: 6,
              same: 3,
              worse: 1,
            },
          },
          {
            key: 'reading:worry-time',
            kindLabel: 'Leitura',
            title: 'A hora da preocupação',
            stats: null,
          },
        ]}
      />,
    )

    const anxiety = screen.getByRole('row', { name: /Quando a ansiedade aperta/ })
    const reading = screen.getByRole('row', { name: /A hora da preocupação/ })
    expect(
      within(anxiety)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['12', '20', '15', '75%', '5', '60%', '30%', '10%'])
    expect(
      within(reading)
        .getAllByRole('cell')
        .every((cell) => cell.textContent === '—'),
    ).toBe(true)
  })
})
