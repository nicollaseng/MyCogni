import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { AuthIntro } from './auth-intro'

const email = 'ana@exemplo.com'

describe('AuthIntro', () => {
  it('tells that the email has a code and a link when confirming the account', () => {
    renderWithIntl(<AuthIntro section="verify" email={email} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Confira seu email' })).toBeInTheDocument()
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === 'P' &&
          element.textContent ===
            'Enviamos um código de 6 números para ana@exemplo.com. Digite o código abaixo ou toque no link do email. Ele vale por 1 hora.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(email)).toHaveClass('text-foreground')
  })

  it('promises a code and a link when the password is forgotten', () => {
    renderWithIntl(<AuthIntro section="forgotPassword" />)

    expect(
      screen.getByText(
        'Digite seu email. Se houver uma conta, enviamos um código e um link para você criar uma nova senha.',
      ),
    ).toBeInTheDocument()
  })

  it('offers the link from the email when resetting the password', () => {
    renderWithIntl(<AuthIntro section="resetPassword" email={email} />)

    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === 'P' &&
          element.textContent ===
            'Digite o código que enviamos para ana@exemplo.com. Depois você escolhe a nova senha. Se preferir, toque no link do email.',
      ),
    ).toBeInTheDocument()
  })

  it('asks for the new password after the recovery link', () => {
    renderWithIntl(<AuthIntro section="newPassword" />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Crie uma nova senha' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Escolha a nova senha da sua conta. Depois de salvar, você continua conectado.',
      ),
    ).toBeInTheDocument()
  })

  it('speaks European Portuguese and English', () => {
    const { unmount } = renderWithIntl(<AuthIntro section="forgotPassword" />, {
      locale: 'pt-PT',
    })
    expect(
      screen.getByText(
        'Introduza o seu email. Se existir uma conta, enviamos-lhe um código e um link para criar uma nova palavra-passe.',
      ),
    ).toBeInTheDocument()
    unmount()

    renderWithIntl(<AuthIntro section="forgotPassword" />, { locale: 'en-US' })
    expect(
      screen.getByText(
        'Enter your email. If there is an account, we will send you a code and a link to create a new password.',
      ),
    ).toBeInTheDocument()
  })
})
