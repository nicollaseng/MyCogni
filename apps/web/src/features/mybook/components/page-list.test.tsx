import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { groupByMonth } from '../months'
import { now, summaryOf, timeZone } from '../test-data'
import { PageList } from './page-list'

const pages = [
  summaryOf({
    id: '8a7d3c1e-0000-4000-8000-000000000001',
    title: 'Um domingo mais leve',
    imageCount: 2,
    updatedAt: '2026-10-15T13:05:00.000Z',
  }),
  summaryOf({
    id: '8a7d3c1e-0000-4000-8000-000000000002',
    title: null,
    excerpt: '',
    updatedAt: '2026-10-09T22:00:00.000Z',
  }),
  summaryOf({
    id: '8a7d3c1e-0000-4000-8000-000000000003',
    title: 'Lista de gratidão',
    excerpt: 'O abraço da minha mãe',
    updatedAt: '2026-09-28T23:00:00.000Z',
  }),
]

function renderList() {
  renderWithIntl(
    <PageList
      groups={groupByMonth(pages, timeZone)}
      now={now}
      timeZone={timeZone}
      hrefOf={(id) => `/mybook/${id}`}
    />,
  )
}

describe('PageList', () => {
  it('groups the pages by month in soft panels', () => {
    renderList()

    const october = screen.getByRole('region', { name: 'Outubro' })
    const september = screen.getByRole('region', { name: 'Setembro' })

    expect(within(october).getAllByRole('link')).toHaveLength(2)
    expect(within(september).getByRole('link')).toHaveTextContent(
      'Lista de gratidão28 de set.O abraço da minha mãe',
    )
  })

  it('shows the title, a short date, the excerpt and how many photos a page has', () => {
    renderList()

    const page = screen.getByRole('link', { name: /Um domingo mais leve/ })

    expect(page).toHaveAttribute('href', '/mybook/8a7d3c1e-0000-4000-8000-000000000001')
    expect(page).toHaveTextContent('10:05')
    expect(page).toHaveTextContent('Acordei cedo e fui caminhar no parque.')
    expect(within(page).getByText('2 fotos')).toBeInTheDocument()
  })

  it('names pages without a title and without text', () => {
    renderList()

    const blank = screen.getByRole('link', { name: /Sem título/ })

    expect(blank).toHaveTextContent('Sem título9 de out.Página em branco')
    expect(within(blank).queryByText(/foto/)).not.toBeInTheDocument()
  })
})
