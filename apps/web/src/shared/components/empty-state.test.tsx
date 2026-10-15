import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('shows the title and the explanation as two centered lines', () => {
    render(<EmptyState title="Nada por aqui." description="Quando algo chegar, aparece aqui." />)

    const title = screen.getByText('Nada por aqui.')
    expect(title.parentElement).toHaveClass('text-center')
    expect(screen.getByText('Quando algo chegar, aparece aqui.')).toBeInTheDocument()
  })
})
