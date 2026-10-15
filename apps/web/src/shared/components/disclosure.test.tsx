import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Disclosure, disclosureDuration } from './disclosure'

describe('Disclosure', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('opens and closes with the button, keeping the content until the motion ends', async () => {
    const user = userEvent.setup({
      advanceTimers: (delay) => {
        jest.advanceTimersByTime(delay)
      },
    })
    render(<Disclosure summary="Como funciona?">Uma resposta curta.</Disclosure>)
    const button = screen.getByRole('button', { name: 'Como funciona?' })
    const panel = document.getElementById(button.getAttribute('aria-controls') ?? '')

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(panel).toHaveAttribute('inert')
    expect(screen.queryByText('Uma resposta curta.')).not.toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(panel).not.toHaveAttribute('inert')
    expect(panel).toHaveAttribute('data-state', 'open')
    expect(screen.getByText('Uma resposta curta.')).toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(panel).toHaveAttribute('data-state', 'closed')
    expect(screen.getByText('Uma resposta curta.')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(disclosureDuration)
    })
    expect(screen.queryByText('Uma resposta curta.')).not.toBeInTheDocument()
  })

  it('can start open', () => {
    render(
      <Disclosure summary="Detalhes" defaultOpen>
        Aberto desde o início.
      </Disclosure>,
    )

    expect(screen.getByRole('button', { name: 'Detalhes' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('Aberto desde o início.')).toBeVisible()
  })
})
