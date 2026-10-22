import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { NavigationLinks } from './navigation-links'

describe('NavigationLinks', () => {
  it('links to the five sections of the app by name and leaves the account out', () => {
    renderWithIntl(<NavigationLinks pathname="/today" variant="bar" />)

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Hoje',
      'Registros',
      'Zen',
      'MyBook',
      'Padrões',
    ])
    expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('href', '/today')
    expect(screen.getByRole('link', { name: 'Registros' })).toHaveAttribute('href', '/entries')
    expect(screen.getByRole('link', { name: 'MyBook' })).toHaveAttribute('href', '/mybook')
    expect(screen.getByRole('link', { name: 'Padrões' })).toHaveAttribute('href', '/patterns')
    expect(screen.getByRole('link', { name: 'Zen' })).toHaveAttribute('href', '/zen')
    expect(screen.queryByRole('link', { name: 'Você' })).not.toBeInTheDocument()
  })

  it('marks no section while the person is on the account pages', () => {
    renderWithIntl(<NavigationLinks pathname="/me" variant="top" />)

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })

  it('marks only the current section as the current page', () => {
    renderWithIntl(<NavigationLinks pathname="/patterns" variant="top" />)

    expect(screen.getByRole('link', { name: 'Padrões' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Hoje' })).not.toHaveAttribute('aria-current')
  })

  it('keeps the section marked on its inner pages', () => {
    renderWithIntl(<NavigationLinks pathname="/entries/2026-10-14" variant="bar" />)

    expect(screen.getByRole('link', { name: 'Registros' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps MyBook marked while writing a page', () => {
    renderWithIntl(
      <NavigationLinks pathname="/mybook/8a7d3c1e-0000-4000-8000-000000000001" variant="bar" />,
    )

    expect(screen.getByRole('link', { name: 'MyBook' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps Zen marked while reading an article', () => {
    renderWithIntl(<NavigationLinks pathname="/zen/articles/worry-time" variant="top" />)

    expect(screen.getByRole('link', { name: 'Zen' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks no section outside the app', () => {
    renderWithIntl(<NavigationLinks pathname="/" variant="bar" />)

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })

  it.each(['bar', 'top'] as const)(
    'puts Zen in the middle with its own mark and active state on the %s',
    (variant) => {
      const { container, rerender } = renderWithIntl(
        <NavigationLinks pathname="/today" variant={variant} />,
      )
      const zen = screen.getByRole('link', { name: 'Zen' })

      expect(zen).toHaveAttribute('data-zen-tab')
      expect(zen.querySelector('svg')).toHaveAttribute('aria-hidden')
      expect(zen.querySelector('svg')).toHaveAttribute('data-icon', 'lotus')
      expect(zen).not.toHaveAttribute('aria-current')
      expect(container.querySelectorAll('[data-zen-tab]')).toHaveLength(1)

      rerender(<NavigationLinks pathname="/zen/tracks/sleep-and-rest" variant={variant} />)

      expect(screen.getByRole('link', { name: 'Zen' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Hoje' })).not.toHaveAttribute('aria-current')
    },
  )
})
