import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { HelpDisclosure } from './help-disclosure'

describe('HelpDisclosure', () => {
  it('stays discreet until the person asks for help', () => {
    const { container } = renderWithIntl(<HelpDisclosure />)

    expect(container.querySelector('details')).not.toHaveAttribute('open')
  })

  it('opens with the numbers to call', async () => {
    const user = userEvent.setup()
    const { container } = renderWithIntl(<HelpDisclosure />)

    await user.click(screen.getByText('Precisa de ajuda agora?'))

    expect(container.querySelector('details')).toHaveAttribute('open')
    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
    expect(screen.getByRole('link', { name: '192' })).toHaveAttribute('href', 'tel:192')
    expect(screen.getByText('O MyCogniAI não substitui acompanhamento profissional.')).toBeVisible()
  })

  it('lists the crisis lines of the country of the language in use', async () => {
    const user = userEvent.setup()
    renderWithIntl(<HelpDisclosure />, { locale: 'pt-PT' })

    await user.click(screen.getByText('Precisa de ajuda agora?'))

    expect(screen.getByRole('link', { name: '808 24 24 24' })).toHaveAttribute(
      'href',
      'tel:808242424',
    )
    expect(screen.getByRole('link', { name: '112' })).toBeVisible()
    expect(screen.queryByRole('link', { name: '188' })).not.toBeInTheDocument()
  })

  it('speaks English with the British lines', async () => {
    const user = userEvent.setup()
    renderWithIntl(<HelpDisclosure />, { locale: 'en-GB' })

    await user.click(screen.getByText('Need help right now?'))

    expect(screen.getByRole('link', { name: '116 123' })).toHaveAttribute('href', 'tel:116123')
    expect(screen.getByText('Samaritans, free, 24/7')).toBeVisible()
  })
})
