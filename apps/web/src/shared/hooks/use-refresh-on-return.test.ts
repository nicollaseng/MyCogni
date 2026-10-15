import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { staleAfterMs, useRefreshOnReturn } from './use-refresh-on-return'

let visibility: DocumentVisibilityState = 'visible'

function come(back: 'visibilitychange' | 'focus') {
  visibility = 'visible'
  if (back === 'focus') {
    window.dispatchEvent(new Event('focus'))
  } else {
    document.dispatchEvent(new Event('visibilitychange'))
  }
}

function leave() {
  visibility = 'hidden'
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useRefreshOnReturn', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-15T12:00:00Z') })
    jest.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('refreshes once when the person comes back after the data got old', () => {
    const refresh = jest.fn()
    renderHook(() => {
      useRefreshOnReturn(refresh, '/today')
    })

    leave()
    jest.advanceTimersByTime(staleAfterMs + 1)
    come('visibilitychange')
    come('focus')

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps the page as it is after a short break', () => {
    const refresh = jest.fn()
    renderHook(() => {
      useRefreshOnReturn(refresh, '/today')
    })

    leave()
    jest.advanceTimersByTime(staleAfterMs - 1000)
    come('focus')

    expect(refresh).not.toHaveBeenCalled()
  })

  it('counts the age from the last page the person opened', () => {
    const refresh = jest.fn()
    const { rerender } = renderHook(
      ({ page }: { page: string }) => {
        useRefreshOnReturn(refresh, page)
      },
      { initialProps: { page: '/today' } },
    )

    jest.advanceTimersByTime(staleAfterMs - 1000)
    rerender({ page: '/entries' })
    jest.advanceTimersByTime(2000)
    come('focus')

    expect(refresh).not.toHaveBeenCalled()
  })

  it('ignores the moment the page is hidden', () => {
    const refresh = jest.fn()
    renderHook(() => {
      useRefreshOnReturn(refresh, '/today')
    })

    jest.advanceTimersByTime(staleAfterMs + 1)
    leave()

    expect(refresh).not.toHaveBeenCalled()
  })
})
