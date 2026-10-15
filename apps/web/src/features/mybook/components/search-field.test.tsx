import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchField } from './search-field'

function setup(initial = '') {
  const onSearch = jest.fn<(query: string) => void>()
  const user = userEvent.setup({
    advanceTimers: (ms) => {
      jest.advanceTimersByTime(ms)
    },
  })
  render(
    <SearchField
      label="Buscar no MyBook"
      placeholder="Buscar"
      initial={initial}
      onSearch={onSearch}
    />,
  )
  return { onSearch, user, field: screen.getByRole('searchbox', { name: 'Buscar no MyBook' }) }
}

describe('SearchField', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('searches once the person pauses typing', async () => {
    const { onSearch, user, field } = setup()

    await user.type(field, 'praia')
    expect(onSearch).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('praia')
  })

  it('searches right away on enter and ignores surrounding spaces', async () => {
    const { onSearch, user, field } = setup()

    await user.type(field, '  sol {Enter}')

    expect(onSearch).toHaveBeenCalledWith('sol')
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('starts from the current search and clears it', async () => {
    const { onSearch, user, field } = setup('praia')

    expect(field).toHaveValue('praia')
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(onSearch).not.toHaveBeenCalled()

    await user.clear(field)
    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(onSearch).toHaveBeenCalledWith('')
  })
})
