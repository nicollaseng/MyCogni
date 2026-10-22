import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastRegion, UndoToast } from './undo-toast'

function renderToast() {
  const onUndo = jest.fn<() => void>()
  const onExpire = jest.fn<() => void>()
  render(
    <>
      <button type="button">Fora</button>
      <ToastRegion>
        <UndoToast
          message="Memória apagada"
          undoLabel="Desfazer"
          duration={5000}
          onUndo={onUndo}
          onExpire={onExpire}
        />
      </ToastRegion>
    </>,
  )
  const user = userEvent.setup({
    advanceTimers: (ms) => {
      jest.advanceTimersByTime(ms)
    },
  })
  return { onUndo, onExpire, user }
}

describe('UndoToast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('speaks politely and offers the undo', async () => {
    const { onUndo, user } = renderToast()

    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveTextContent('Memória apagada')
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))

    expect(onUndo).toHaveBeenCalled()
  })

  it('expires after its time', () => {
    const { onExpire } = renderToast()

    act(() => {
      jest.advanceTimersByTime(4999)
    })
    expect(onExpire).not.toHaveBeenCalled()
    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('waits while the undo has focus and starts over when it leaves', async () => {
    const { onExpire, user } = renderToast()

    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Desfazer' })).toHaveFocus()
    act(() => {
      jest.advanceTimersByTime(20_000)
    })
    expect(onExpire).not.toHaveBeenCalled()

    await user.tab({ shift: true })
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})
