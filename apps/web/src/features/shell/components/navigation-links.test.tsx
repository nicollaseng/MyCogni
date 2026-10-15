import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { NavigationLinks } from './navigation-links'

describe('NavigationLinks', () => {
  it('links to every section of the app by name', () => {
    renderWithIntl(<NavigationLinks pathname="/today" variant="bar" />)

    expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('href', '/today')
    expect(screen.getByRole('link', { name: 'Registros' })).toHaveAttribute('href', '/entries')
    expect(screen.getByRole('link', { name: 'MyBook' })).toHaveAttribute('href', '/mybook')
    expect(screen.getByRole('link', { name: 'Padrões' })).toHaveAttribute('href', '/patterns')
    expect(screen.getByRole('link', { name: 'Você' })).toHaveAttribute('href', '/me')
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

  it('marks no section outside the app', () => {
    renderWithIntl(<NavigationLinks pathname="/" variant="bar" />)

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })
})
