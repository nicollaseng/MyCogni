import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelpDisclosure } from './help-disclosure'

describe('HelpDisclosure', () => {
  it('stays discreet until the person asks for help', () => {
    const { container } = render(<HelpDisclosure />)

    expect(container.querySelector('details')).not.toHaveAttribute('open')
  })

  it('opens with the numbers to call', async () => {
    const user = userEvent.setup()
    const { container } = render(<HelpDisclosure />)

    await user.click(screen.getByText('Precisa de ajuda agora?'))

    expect(container.querySelector('details')).toHaveAttribute('open')
    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
    expect(screen.getByRole('link', { name: '192' })).toHaveAttribute('href', 'tel:192')
    expect(screen.getByText('O MyCogniAI não substitui acompanhamento profissional.')).toBeVisible()
  })
})
