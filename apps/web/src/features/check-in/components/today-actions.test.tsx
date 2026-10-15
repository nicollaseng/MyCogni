import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { TodayActions } from './today-actions'

describe('TodayActions', () => {
  it('offers a single main action to record the mood', () => {
    renderWithIntl(<TodayActions />)

    expect(screen.getByRole('link', { name: 'Registrar como estou' })).toHaveAttribute(
      'href',
      '/check-in',
    )
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('leaves MyBook as a quiet link inside one sentence', () => {
    renderWithIntl(<TodayActions />)

    const mybook = screen.getByRole('link', { name: 'Abrir o MyBook' })
    expect(mybook).toHaveAttribute('href', '/mybook')
    expect(mybook.closest('p')).toHaveTextContent('Prefere escrever? Abrir o MyBook')
  })

  it('speaks the language of the person', () => {
    renderWithIntl(<TodayActions />, { locale: 'pt-PT' })

    expect(screen.getByRole('link', { name: 'Registar como estou' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir o MyBook' }).closest('p')).toHaveTextContent(
      'Prefere escrever? Abrir o MyBook',
    )
  })

  it('writes the invitation to MyBook in English', () => {
    renderWithIntl(<TodayActions />, { locale: 'en-GB' })

    expect(screen.getByRole('link', { name: 'Log how I feel' })).toHaveAttribute(
      'href',
      '/check-in',
    )
    expect(screen.getByRole('link', { name: 'Open MyBook' }).closest('p')).toHaveTextContent(
      'Prefer to write? Open MyBook',
    )
  })
})
