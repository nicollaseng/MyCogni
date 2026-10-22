import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { Wordmark } from './wordmark'

describe('Wordmark', () => {
  it('puts the relief mark next to the name, hidden from assistive technology', () => {
    render(<Wordmark href="/today" />)

    const link = screen.getByRole('link', { name: 'MyCogniAI' })
    expect(link).toHaveAttribute('href', '/today')
    const mark = screen.getByTestId('brand-mark')
    expect(link.firstElementChild).toBe(mark)
    expect(mark).toHaveAttribute('aria-hidden')
    expect(mark.querySelectorAll('path')).toHaveLength(3)
    expect(mark.querySelector('path')).toHaveAttribute('fill', 'currentColor')
  })
})
