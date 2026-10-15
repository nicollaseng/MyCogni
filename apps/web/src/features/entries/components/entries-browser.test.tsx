import { describe, expect, it } from '@jest/globals'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { fakeRouter, WithRouter } from '@/test/router'
import { noFilters, type EntryFilters } from '../filters'
import { EntriesBrowser } from './entries-browser'

function browserWith(filters: EntryFilters, router: ReturnType<typeof fakeRouter>) {
  return (
    <WithRouter router={router}>
      <EntriesBrowser filters={filters} customEmotions={[]} customContexts={[]} total={4}>
        <p>lista</p>
      </EntriesBrowser>
    </WithRouter>
  )
}

describe('EntriesBrowser', () => {
  it('keeps the filters in the address, adding one history step per visit to the panel', async () => {
    const router = fakeRouter()
    const user = userEvent.setup()
    const { rerender } = renderWithIntl(browserWith(noFilters, router))

    await user.click(screen.getByRole('button', { name: /^Filtros/ }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Filtros' })).getByRole('radio', {
        name: '7 dias',
      }),
    )
    expect(router.push.mock.lastCall?.[0]).toBe('/entries?period=7')

    rerender(browserWith({ ...noFilters, period: '7' }, router))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Filtros' })).getByRole('checkbox', {
        name: 'Só com nota',
      }),
    )
    expect(router.replace.mock.lastCall?.[0]).toBe('/entries?period=7&note=1')
    expect(router.push).toHaveBeenCalledTimes(1)
  })

  it('searches with a new history step', async () => {
    const router = fakeRouter()
    const user = userEvent.setup()
    renderWithIntl(browserWith({ ...noFilters, withNote: true }, router))

    await act(async () => {
      await user.type(screen.getByRole('searchbox'), 'chuva{Enter}')
    })

    expect(router.push.mock.lastCall?.[0]).toBe('/entries?q=chuva&note=1')
    expect(screen.getByText('lista')).toBeVisible()
  })
})
