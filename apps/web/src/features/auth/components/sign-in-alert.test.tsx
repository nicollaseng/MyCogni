import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { SignInAlert } from './sign-in-alert'

describe('SignInAlert', () => {
  it('explains a confirmation link that expired or was opened elsewhere', () => {
    renderWithIntl(<SignInAlert error="link" />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'O link expirou ou foi aberto em outro navegador. Use o código do email ou peça um novo.',
    )
  })

  it('keeps the messages for an ended session and a failed Google sign in', () => {
    const { unmount } = renderWithIntl(<SignInAlert error="session" />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sua sessão terminou. Entre de novo para continuar.',
    )
    unmount()

    renderWithIntl(<SignInAlert error="oauth" />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível entrar com o Google. Tente de novo.',
    )
  })

  it('shows nothing for an unknown or repeated error', () => {
    const { rerender } = renderWithIntl(<SignInAlert error="toString" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(<SignInAlert error={['link', 'oauth']} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(<SignInAlert error={undefined} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('speaks European Portuguese and English', () => {
    const { unmount } = renderWithIntl(<SignInAlert error="link" />, { locale: 'pt-PT' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'O link expirou ou foi aberto noutro navegador. Use o código do email ou peça um novo.',
    )
    unmount()

    renderWithIntl(<SignInAlert error="link" />, { locale: 'en-GB' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The link has expired or was opened in a different browser. Use the code from the email or ask for a new one.',
    )
  })
})
