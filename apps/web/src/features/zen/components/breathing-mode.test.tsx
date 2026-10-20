import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { AmbientRoot } from '@/features/audio/ambient-provider'
import { fakeEngine } from '@/test/ambient'
import { renderWithIntl } from '@/test/render'
import { breathingModeDuration, BreathingMode } from './breathing-mode'

function preferReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
}

function advanceTimers(ms: number) {
  jest.advanceTimersByTime(ms)
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms)
  })
}

function Opener() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
        }}
      >
        Respirar
      </button>
      {open && (
        <BreathingMode
          onClose={() => {
            setOpen(false)
          }}
        />
      )}
    </>
  )
}

async function openMode() {
  const user = userEvent.setup({ advanceTimers })
  renderWithIntl(<Opener />)
  await user.click(screen.getByRole('button', { name: 'Respirar' }))
  const dialog = screen.getByRole('dialog', { name: 'Respirar em quadrado' })
  return { user, dialog }
}

function status() {
  return screen.getByRole('status')
}

function count() {
  return screen.getByTestId('breathing-count')
}

describe('BreathingMode', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    Reflect.deleteProperty(window, 'matchMedia')
    window.localStorage.clear()
    Reflect.deleteProperty(window.navigator, 'userActivation')
  })

  it('opens as a full-screen modal on the zen surface, with one line and one action', async () => {
    const { dialog } = await openMode()

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()
    expect(dialog.className).toMatch(/fixed inset-0/)
    expect(dialog.className).toMatch(/bg-zen/)
    expect(document.body.style.overflow).toBe('hidden')
    expect(
      within(dialog).getByText(/Inspire, segure, solte e espere, contando até quatro/),
    ).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Começar' })).toBeVisible()
    expect(screen.getByTestId('breathing-square')).toHaveAttribute('data-status', 'idle')
    expect(screen.getByTestId('breathing-fill').className).toMatch(/animate-box-idle/)
    expect(status()).toHaveTextContent('')
  })

  it('guides each phase with a countdown, round by round, then offers one more round', async () => {
    const { user } = await openMode()

    await user.click(screen.getByRole('button', { name: 'Começar' }))

    expect(status()).toHaveTextContent('Inspire')
    expect(status()).toHaveAttribute('aria-live', 'polite')
    expect(count()).toHaveTextContent('4')
    expect(screen.getByText('Volta 1 de 4')).toBeVisible()
    advance(1000)
    expect(count()).toHaveTextContent('3')
    advance(3000)
    expect(status()).toHaveTextContent('Segure')
    expect(count()).toHaveTextContent('4')
    advance(4000)
    expect(status()).toHaveTextContent('Solte')
    advance(4000)
    expect(status()).toHaveTextContent('Espere')
    advance(3000)
    expect(count()).toHaveTextContent('1')
    advance(1000)
    expect(status()).toHaveTextContent('Inspire')
    expect(screen.getByText('Volta 2 de 4')).toBeVisible()
    advance(48_000)

    expect(status()).toHaveTextContent('Pronto. Como você está agora?')
    expect(screen.getByText('Pronto.')).toBeVisible()
    expect(screen.queryByTestId('breathing-count')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Fechar' })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Mais uma volta' }))

    expect(status()).toHaveTextContent('Inspire')
    expect(screen.getByText('Volta 5 de 5')).toBeVisible()
    advance(16_000)
    expect(status()).toHaveTextContent('Pronto. Como você está agora?')
  })

  it('pauses on the same phase and continues from there', async () => {
    const { user } = await openMode()

    await user.click(screen.getByRole('button', { name: 'Começar' }))
    advance(5000)
    await user.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(screen.getByTestId('breathing-square')).toHaveAttribute('data-status', 'paused')
    expect(screen.getByTestId('breathing-dot')).toHaveStyle({ animationPlayState: 'paused' })
    advance(20_000)

    expect(status()).toHaveTextContent('Segure')
    expect(count()).toHaveTextContent('3')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByTestId('breathing-dot')).toHaveStyle({ animationPlayState: 'running' })
    advance(3000)
    expect(status()).toHaveTextContent('Solte')
  })

  it('moves a dot, draws the edge and breathes the inner square while running', async () => {
    const { user } = await openMode()

    await user.click(screen.getByRole('button', { name: 'Começar' }))

    expect(screen.getByTestId('breathing-dot').className).toMatch(/animate-box-dot/)
    expect(screen.getByTestId('breathing-trail')).toHaveAttribute('pathLength', '4')
    expect(screen.getByTestId('breathing-fill').className).toMatch(/animate-box-fill/)
    expect(screen.getByTestId('breathing-dot')).toHaveStyle({ animationDuration: '16000ms' })
  })

  it('only changes the word and the countdown when the person prefers less motion', async () => {
    preferReducedMotion(true)
    const { user } = await openMode()

    expect(screen.getByTestId('breathing-fill').className).not.toMatch(/animate-box/)
    await user.click(screen.getByRole('button', { name: 'Começar' }))

    expect(screen.queryByTestId('breathing-dot')).not.toBeInTheDocument()
    expect(screen.queryByTestId('breathing-trail')).not.toBeInTheDocument()
    expect(screen.getByTestId('breathing-fill').className).not.toMatch(/animate-box/)
    expect(status()).toHaveTextContent('Inspire')
    advance(2000)
    expect(count()).toHaveTextContent('2')
    advance(2000)
    expect(status()).toHaveTextContent('Segure')
  })

  it('closes with Escape and gives the focus back', async () => {
    const { user, dialog } = await openMode()

    await user.click(within(dialog).getByRole('button', { name: 'Começar' }))
    await user.keyboard('{Escape}')
    advance(breathingModeDuration)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Respirar' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes from the corner and from the end of the exercise', async () => {
    const { user } = await openMode()

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    advance(breathingModeDuration)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Respirar' }))
    await user.click(screen.getByRole('button', { name: 'Começar' }))
    advance(64_000)
    const [, done] = screen.getAllByRole('button', { name: 'Fechar' })
    expect(done).toBeDefined()
    if (done !== undefined) {
      await user.click(done)
    }
    advance(breathingModeDuration)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the keyboard inside and moves focus with the main action', async () => {
    const { user } = await openMode()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Começar' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Pausar' })).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Continuar' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  })

  it('leaves the background sound playing while breathing', async () => {
    Object.defineProperty(window.navigator, 'userActivation', {
      configurable: true,
      value: { hasBeenActive: true, isActive: false },
    })
    const engine = fakeEngine()
    const user = userEvent.setup({ advanceTimers })
    renderWithIntl(
      <AmbientRoot pathname="/zen" engine={() => engine}>
        <Opener />
      </AmbientRoot>,
    )
    await act(async () => {
      await Promise.resolve()
    })
    const played = engine.play.mock.calls.length
    expect(played).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Respirar' }))
    await user.click(screen.getByRole('button', { name: 'Começar' }))
    advance(8000)
    await user.keyboard('{Escape}')
    advance(breathingModeDuration)

    expect(engine.stop).not.toHaveBeenCalled()
    expect(engine.play).toHaveBeenCalledTimes(played)
  })
})
