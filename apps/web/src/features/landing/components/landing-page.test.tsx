import { describe, expect, it } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import { LandingPage } from './landing-page'

describe('LandingPage', () => {
  it('opens with the question the app asks every day', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Como você está agora?' }),
    ).toBeInTheDocument()
  })

  it('lets the visitor try the mood scale right away', () => {
    render(<LandingPage />)

    const slider = screen.getByRole('slider', { name: 'Como você está agora?' })
    expect(slider).toHaveAttribute('aria-valuetext', 'Neutro')

    fireEvent.change(slider, { target: { value: '6' } })

    expect(slider).toHaveAttribute('aria-valuetext', 'Muito bem')
    expect(screen.getByText('Muito bem')).toBeInTheDocument()
  })

  it('leads into the app', () => {
    render(<LandingPage />)

    expect(screen.getByRole('link', { name: 'Começar' })).toHaveAttribute('href', '/today')
  })

  it('is upfront about what the product is not', () => {
    render(<LandingPage />)

    expect(
      screen.getByText('Não é terapia nem diagnóstico. Seus dados são seus.'),
    ).toBeInTheDocument()
  })

  it('offers help for a crisis', () => {
    render(<LandingPage />)

    expect(screen.getByText('Precisa de ajuda agora?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
  })
})
