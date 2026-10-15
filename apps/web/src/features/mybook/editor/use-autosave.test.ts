import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import { useAutosave } from './use-autosave'

type Save = () => Promise<boolean>

function deferred() {
  let settle: (value: boolean) => void = () => undefined
  const promise = new Promise<boolean>((resolve) => {
    settle = resolve
  })
  return { promise, settle }
}

async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms)
  })
}

describe('useAutosave', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('saves once after the person stops typing for a moment', async () => {
    const save = jest.fn<Save>(() => Promise.resolve(true))
    const { result } = renderHook(() => useAutosave(save))

    expect(result.current.status).toBe('idle')
    act(() => {
      result.current.touch()
    })
    await advance(500)
    act(() => {
      result.current.touch()
    })
    await advance(799)

    expect(result.current.status).toBe('pending')
    expect(save).not.toHaveBeenCalled()

    await advance(1)

    expect(save).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('saved')
  })

  it('shows the save in progress and saves again what changed meanwhile', async () => {
    const first = deferred()
    const save = jest.fn<Save>().mockReturnValueOnce(first.promise).mockResolvedValue(true)
    const { result } = renderHook(() => useAutosave(save))

    act(() => {
      result.current.touch()
    })
    await advance(800)
    expect(result.current.status).toBe('saving')

    act(() => {
      result.current.touch()
    })
    await act(async () => {
      first.settle(true)
      await Promise.resolve()
    })
    expect(save).toHaveBeenCalledTimes(1)

    await advance(800)

    expect(save).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('saved')
  })

  it('reports a failed save and tries again when asked', async () => {
    const save = jest.fn<Save>().mockResolvedValueOnce(false).mockResolvedValue(true)
    const { result } = renderHook(() => useAutosave(save))

    act(() => {
      result.current.touch()
    })
    await advance(800)
    expect(result.current.status).toBe('failed')

    let saved = false
    await act(async () => {
      saved = await result.current.flush()
    })

    expect(saved).toBe(true)
    expect(save).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('saved')
  })

  it('treats a thrown error as a failed save', async () => {
    const save = jest.fn<Save>(() => Promise.reject(new Error('offline')))
    const { result } = renderHook(() => useAutosave(save))

    act(() => {
      result.current.touch()
    })
    await advance(800)

    expect(result.current.status).toBe('failed')
  })

  it('saves pending changes right away when flushed', async () => {
    const save = jest.fn<Save>(() => Promise.resolve(true))
    const { result } = renderHook(() => useAutosave(save))

    act(() => {
      result.current.touch()
    })
    await act(async () => {
      await result.current.flush()
    })

    expect(save).toHaveBeenCalledTimes(1)
    await advance(2000)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('drops pending changes when cancelled', async () => {
    const save = jest.fn<Save>(() => Promise.resolve(true))
    const { result, unmount } = renderHook(() => useAutosave(save))

    act(() => {
      result.current.touch()
      result.current.cancel()
    })
    await advance(2000)
    unmount()

    expect(save).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it('saves what is pending when the editor goes away', async () => {
    const save = jest.fn<Save>(() => Promise.resolve(true))
    const { result, unmount } = renderHook(() => useAutosave(save))

    act(() => {
      result.current.touch()
    })
    unmount()
    await advance(0)

    expect(save).toHaveBeenCalledTimes(1)
  })

  it('saves what is pending when the page is hidden', async () => {
    const save = jest.fn<Save>(() => Promise.resolve(true))
    const { result } = renderHook(() => useAutosave(save))
    const visibility = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')

    act(() => {
      result.current.touch()
    })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await Promise.resolve()
    })
    visibility.mockRestore()

    expect(save).toHaveBeenCalledTimes(1)
  })
})
