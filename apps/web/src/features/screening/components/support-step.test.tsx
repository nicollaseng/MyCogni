import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { SupportStep } from './support-step'

describe('SupportStep', () => {
  it('points to the Brazilian crisis lines and lets the person carry on', async () => {
    const onContinue = jest.fn()
    renderWithIntl(<SupportStep onContinue={onContinue} />)

    expect(screen.getByRole('heading', { name: 'Obrigado por contar.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar para o CVV' })).toHaveAttribute(
      'href',
      'tel:188',
    )
    expect(screen.getByRole('link', { name: '192' })).toHaveAttribute('href', 'tel:192')

    await userEvent.click(screen.getByRole('button', { name: 'Continuar o questionário' }))

    expect(onContinue).toHaveBeenCalled()
  })

  it('points to the Portuguese crisis lines in Portugal', () => {
    renderWithIntl(<SupportStep onContinue={jest.fn()} />, { locale: 'pt-PT' })

    expect(screen.getByRole('heading', { name: 'Obrigado por partilhar.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar para o SNS 24' })).toHaveAttribute(
      'href',
      'tel:808242424',
    )
    expect(screen.getByRole('link', { name: '213 544 545' })).toHaveAttribute(
      'href',
      'tel:213544545',
    )
    expect(screen.getByText(/SOS Voz Amiga/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '112' })).toHaveAttribute('href', 'tel:112')
    expect(screen.queryByText(/188/)).not.toBeInTheDocument()
  })

  it('points to Samaritans in the United Kingdom', () => {
    renderWithIntl(<SupportStep onContinue={jest.fn()} />, { locale: 'en-GB' })

    expect(screen.getByRole('link', { name: 'Call Samaritans' })).toHaveAttribute(
      'href',
      'tel:116123',
    )
    expect(screen.getByText('In danger right now? Go to your nearest A&E.')).toBeInTheDocument()
  })
})
