import { describe, expect, it } from '@jest/globals'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    fireEvent.change(slider, { target: { value: '6' } })

    expect(slider).toHaveAttribute('aria-valuetext', 'Muito bem')
  })

  it('tells the story in sections the header links to', () => {
    render(<LandingPage />)

    const sections = screen.getByRole('navigation', { name: 'Seções' })

    expect(within(sections).getByRole('link', { name: 'Como funciona' })).toHaveAttribute(
      'href',
      '/#como-funciona',
    )
    expect(
      screen.getByRole('region', { name: 'Um minuto por dia, um retrato a cada duas semanas.' }),
    ).toHaveAttribute('id', 'como-funciona')
    expect(
      screen.getByRole('region', { name: 'A IA escreve. Os números vêm de você.' }),
    ).toHaveAttribute('id', 'ia')
    expect(screen.getByRole('region', { name: 'Seus dados são seus.' })).toHaveAttribute(
      'id',
      'privacidade',
    )
    expect(screen.getByRole('region', { name: 'O que as pessoas perguntam.' })).toHaveAttribute(
      'id',
      'perguntas',
    )
  })

  it('shows what the AI writes and where the numbers come from', () => {
    render(<LandingPage />)

    const ai = screen.getByRole('region', { name: 'A IA escreve. Os números vêm de você.' })

    expect(within(ai).getByText(/Foi uma semana mais leve que a anterior/)).toBeInTheDocument()
    expect(within(ai).getByText('Não diagnostica e não fala de remédio.')).toBeInTheDocument()
  })

  it('answers a question when it is opened', async () => {
    const user = userEvent.setup()
    render(<LandingPage />)

    const question = screen.getByText('O MyCogniAI substitui terapia?')
    const details = question.closest('details')

    expect(details).not.toHaveAttribute('open')

    await user.click(question)

    expect(details).toHaveAttribute('open')
  })

  it('leads into the app from the top and the end of the page', () => {
    render(<LandingPage />)

    const links = screen.getAllByRole('link', { name: 'Começar' })

    expect(links.length).toBeGreaterThanOrEqual(3)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/today')
    }
  })

  it('has a footer with crisis lines and legal pages', () => {
    render(<LandingPage />)

    const footer = screen.getByRole('contentinfo')

    expect(within(footer).getByRole('link', { name: 'CVV · 188' })).toHaveAttribute(
      'href',
      'tel:188',
    )
    expect(within(footer).getByRole('link', { name: 'SAMU · 192' })).toHaveAttribute(
      'href',
      'tel:192',
    )
    expect(within(footer).getByRole('link', { name: 'Termos de uso' })).toHaveAttribute(
      'href',
      '/terms',
    )
    expect(within(footer).getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute(
      'href',
      '/privacy',
    )
  })
})
