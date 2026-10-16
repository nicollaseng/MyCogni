import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { HelpDisclosure } from './help-disclosure'

describe('HelpDisclosure', () => {
  it('adds the WhatsApp of the professionals who set one when the person opens it', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <HelpDisclosure
        professionals={[
          { name: 'Helena Prado', emergencyWhatsapp: '+5511987654321' },
          { name: 'Rui Lima', emergencyWhatsapp: null },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Precisa de ajuda agora?' }))

    expect(
      screen.getByRole('link', { name: 'Fale com Helena Prado agora WhatsApp' }),
    ).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/wa\.me\/5511987654321\?text=Oi%20Helena%20Prado/),
    )
    expect(screen.queryByRole('link', { name: /Rui Lima/ })).not.toBeInTheDocument()
  })

  it('stays discreet until the person asks for help', () => {
    renderWithIntl(<HelpDisclosure />)

    expect(screen.getByRole('button', { name: 'Precisa de ajuda agora?' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('link', { name: '188' })).not.toBeInTheDocument()
  })

  it('opens with the numbers to call', async () => {
    const user = userEvent.setup()
    renderWithIntl(<HelpDisclosure />)

    await user.click(screen.getByRole('button', { name: 'Precisa de ajuda agora?' }))

    expect(screen.getByRole('button', { name: 'Precisa de ajuda agora?' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
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
