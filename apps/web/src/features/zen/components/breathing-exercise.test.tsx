import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { BreathingExercise } from './breathing-exercise'

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

describe('BreathingExercise', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    Reflect.deleteProperty(window, 'matchMedia')
  })

  it('guides four rounds of box breathing, phase by phase', async () => {
    const user = userEvent.setup({ advanceTimers })
    renderWithIntl(<BreathingExercise />)

    expect(screen.getByText('Pronto para começar')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Começar' }))

    expect(screen.getByRole('status')).toHaveTextContent('Inspire')
    expect(screen.getByText('Volta 1 de 4')).toBeInTheDocument()
    advance(4000)
    expect(screen.getByRole('status')).toHaveTextContent('Segure')
    advance(4000)
    expect(screen.getByRole('status')).toHaveTextContent('Solte')
    advance(4000)
    expect(screen.getByRole('status')).toHaveTextContent('Espere')
    advance(4000)
    expect(screen.getByText('Volta 2 de 4')).toBeInTheDocument()
    advance(48_000)

    expect(screen.getByRole('status')).toHaveTextContent('Pronto. Como você está agora?')
    expect(screen.getByRole('button', { name: 'Recomeçar' })).toBeInTheDocument()
  })

  it('pauses and resumes without losing its place', async () => {
    const user = userEvent.setup({ advanceTimers })
    renderWithIntl(<BreathingExercise />)

    await user.click(screen.getByRole('button', { name: 'Começar' }))
    advance(5000)
    await user.click(screen.getByRole('button', { name: 'Pausar' }))
    advance(20_000)

    expect(screen.getByRole('status')).toHaveTextContent('Segure')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    advance(3000)
    expect(screen.getByRole('status')).toHaveTextContent('Solte')

    await user.click(screen.getByRole('button', { name: 'Recomeçar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Inspire')
  })

  it('works from the keyboard alone', async () => {
    const user = userEvent.setup({ advanceTimers })
    renderWithIntl(<BreathingExercise />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Começar' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Pausar' })).toHaveFocus()
    await user.keyboard(' ')

    expect(screen.getByRole('button', { name: 'Continuar' })).toHaveFocus()
  })

  it('moves a dot around the square, unless the person prefers less motion', async () => {
    const user = userEvent.setup({ advanceTimers })
    const { unmount } = renderWithIntl(<BreathingExercise />)
    await user.click(screen.getByRole('button', { name: 'Começar' }))
    expect(screen.getByTestId('breathing-dot')).toBeInTheDocument()
    unmount()

    preferReducedMotion(true)
    renderWithIntl(<BreathingExercise />)
    await user.click(screen.getByRole('button', { name: 'Começar' }))

    expect(screen.queryByTestId('breathing-dot')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Inspire')
    advance(4000)
    expect(screen.getByRole('status')).toHaveTextContent('Segure')
  })
})
