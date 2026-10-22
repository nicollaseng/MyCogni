import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import type { RecordPractice } from './record'
import { ReadingTracker } from './reading-tracker'

type Observed = (entries: { isIntersecting: boolean }[]) => void

let observed: Observed = () => undefined

class FakeObserver {
  constructor(callback: Observed) {
    observed = callback
  }
  observe(): void {
    return undefined
  }
  disconnect(): void {
    return undefined
  }
}

function advanceTimers(ms: number) {
  jest.advanceTimersByTime(ms)
}

describe('ReadingTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: FakeObserver,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    Reflect.deleteProperty(window, 'IntersectionObserver')
  })

  it('counts a reading once the end stays in view for two seconds', () => {
    const record = jest.fn<RecordPractice>(() => Promise.resolve('reading-1'))
    renderWithIntl(<ReadingTracker article="worry-time" record={record} />)

    act(() => {
      jest.advanceTimersByTime(30_000)
      observed([{ isIntersecting: true }])
      jest.advanceTimersByTime(1_000)
      observed([{ isIntersecting: false }])
      jest.advanceTimersByTime(3_000)
    })
    expect(record).not.toHaveBeenCalled()

    act(() => {
      observed([{ isIntersecting: true }])
      jest.advanceTimersByTime(2_000)
    })

    expect(record).toHaveBeenCalledTimes(1)
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reading', contentId: 'worry-time', completed: true }),
    )
    expect(screen.getByRole('button', { name: 'Lida' })).toBeDisabled()
  })

  it('counts a reading marked as read, and never a visit under ten seconds', async () => {
    const user = userEvent.setup({ advanceTimers })
    const record = jest.fn<RecordPractice>(() => Promise.resolve(null))
    const { unmount } = renderWithIntl(<ReadingTracker article="worry-time" record={record} />)

    act(() => {
      jest.advanceTimersByTime(5_000)
    })
    unmount()
    expect(record).not.toHaveBeenCalled()

    renderWithIntl(<ReadingTracker article="worry-time" record={record} />)
    act(() => {
      jest.advanceTimersByTime(12_000)
    })
    await user.click(screen.getByRole('button', { name: 'Marcar como lida' }))

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reading', completed: true }),
    )
  })
})
