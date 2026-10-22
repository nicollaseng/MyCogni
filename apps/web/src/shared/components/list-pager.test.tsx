import { describe, expect, it } from '@jest/globals'
import type { Locale, PageSize } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { listPageQuery, withQuery, type ListPage } from '@/shared/lib/list-page'
import { renderWithIntl } from '@/test/render'
import { fakeRouter, WithRouter } from '@/test/router'
import { ListPager } from './list-pager'

interface Shown {
  page: number
  size?: PageSize
  total: number
  locale?: Locale
}

function renderPager({ page, size = 10, total, locale = 'pt-BR' }: Shown) {
  const router = fakeRouter()
  renderWithIntl(
    <WithRouter router={router}>
      <ListPager
        page={page}
        size={size}
        total={total}
        hrefOf={(target: ListPage) => withQuery('/mybook', { q: 'mar', ...listPageQuery(target) })}
      />
    </WithRouter>,
    { locale },
  )
  return router
}

function pager(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Paginação' })
}

describe('ListPager', () => {
  it('shows where the person is in the list and links to the pages around it', () => {
    renderPager({ page: 2, total: 37 })

    const nav = pager()
    expect(within(nav).getByText('11–20 de 37')).toBeVisible()
    expect(within(nav).getByText('2 / 4')).toBeVisible()
    expect(within(nav).getByRole('link', { name: 'Página anterior' })).toHaveAttribute(
      'href',
      '/mybook?q=mar',
    )
    expect(within(nav).getByRole('link', { name: 'Próxima página' })).toHaveAttribute(
      'href',
      '/mybook?q=mar&page=3',
    )
  })

  it('marks the current page for assistive technology', () => {
    renderPager({ page: 3, total: 37 })

    const current = pager().querySelector('[aria-current="page"]')
    expect(current).toHaveTextContent('Página 3 de 4')
  })

  it('turns off the previous step on the first page', () => {
    renderPager({ page: 1, total: 37 })

    const previous = within(pager()).getByRole('link', { name: 'Página anterior' })
    expect(previous).toHaveAttribute('aria-disabled', 'true')
    expect(previous).not.toHaveAttribute('href')
    expect(within(pager()).getByRole('link', { name: 'Próxima página' })).toHaveAttribute(
      'href',
      '/mybook?q=mar&page=2',
    )
  })

  it('turns off the next step on the last page and names a lone last item', () => {
    renderPager({ page: 4, total: 31 })

    expect(within(pager()).getByText('31 de 31')).toBeVisible()
    const next = within(pager()).getByRole('link', { name: 'Próxima página' })
    expect(next).toHaveAttribute('aria-disabled', 'true')
    expect(next).not.toHaveAttribute('href')
    expect(within(pager()).getByRole('link', { name: 'Página anterior' })).toHaveAttribute(
      'href',
      '/mybook?q=mar&page=3',
    )
  })

  it('keeps the chosen size in every step', () => {
    renderPager({ page: 2, size: 25, total: 80 })

    expect(within(pager()).getByText('26–50 de 80')).toBeVisible()
    expect(within(pager()).getByRole('link', { name: 'Próxima página' })).toHaveAttribute(
      'href',
      '/mybook?q=mar&page=3&size=25',
    )
  })

  it('stays out of the way when everything fits on one page of ten', () => {
    renderPager({ page: 1, total: 10 })

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('shows nothing for an empty list, whatever the size', () => {
    renderPager({ page: 1, size: 50, total: 0 })

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('keeps the size choice reachable when a larger size fits everything', () => {
    renderPager({ page: 1, size: 50, total: 37 })

    expect(within(pager()).getByText('1–37 de 37')).toBeVisible()
    expect(within(pager()).getByRole('combobox', { name: 'Por página' })).toHaveValue('50')
    expect(within(pager()).queryByRole('link')).not.toBeInTheDocument()
  })

  it('goes back to the first page of the new size when the size changes', async () => {
    const user = userEvent.setup()
    const router = renderPager({ page: 3, total: 37 })

    const select = within(pager()).getByRole('combobox', { name: 'Por página' })
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['10', '25', '50', '100'])
    await user.selectOptions(select, '25')

    expect(router.push).toHaveBeenCalledWith('/mybook?q=mar&size=25')
  })

  it('speaks English', () => {
    renderPager({ page: 1, total: 37, locale: 'en-GB' })

    const nav = screen.getByRole('navigation', { name: 'Pagination' })
    expect(within(nav).getByText('1–10 of 37')).toBeVisible()
    expect(within(nav).getByRole('combobox', { name: 'Per page' })).toHaveValue('10')
    expect(within(nav).getByRole('link', { name: 'Next page' })).toBeVisible()
  })
})
