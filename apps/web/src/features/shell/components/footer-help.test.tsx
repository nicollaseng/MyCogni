import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { FooterHelp } from './footer-help'

describe('FooterHelp', () => {
  it('offers crisis help at the bottom of the other areas of the app', () => {
    renderWithIntl(<FooterHelp pathname="/entries" />)

    expect(screen.getByRole('button', { name: 'Precisa de ajuda agora?' })).toBeVisible()
  })

  it('leaves the Zen Space to its own help at the top', () => {
    const { rerender } = renderWithIntl(<FooterHelp pathname="/zen" />)
    expect(
      screen.queryByRole('button', { name: 'Precisa de ajuda agora?' }),
    ).not.toBeInTheDocument()

    rerender(<FooterHelp pathname="/zen/tracks/sleep-and-rest" />)
    expect(
      screen.queryByRole('button', { name: 'Precisa de ajuda agora?' }),
    ).not.toBeInTheDocument()
  })
})
