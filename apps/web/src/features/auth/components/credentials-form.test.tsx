import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { failed, initialFormState, type FormAction } from '../form-state'
import { CredentialsForm } from './credentials-form'

describe('CredentialsForm', () => {
  it('sends what the person typed to the action', async () => {
    const user = userEvent.setup()
    const action = jest.fn<FormAction>().mockResolvedValue(initialFormState)
    renderWithIntl(<CredentialsForm action={action} mode="sign-up" />)

    await user.type(screen.getByLabelText('Email'), 'ana@exemplo.com')
    await user.type(screen.getByLabelText('Senha'), 'senha2026')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    const formData = action.mock.calls[0]?.[1]
    expect(formData?.get('email')).toBe('ana@exemplo.com')
    expect(formData?.get('password')).toBe('senha2026')
  })

  it('shows the problem next to the field and keeps the email', async () => {
    const user = userEvent.setup()
    const action = jest.fn<FormAction>().mockResolvedValue({
      ...initialFormState,
      fieldErrors: { password: 'A senha precisa ter pelo menos 8 caracteres.' },
    })
    renderWithIntl(<CredentialsForm action={action} mode="sign-up" />)

    await user.type(screen.getByLabelText('Email'), 'ana@exemplo.com')
    await user.type(screen.getByLabelText('Senha'), 'curta')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    const password = await screen.findByLabelText('Senha')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAccessibleDescription('A senha precisa ter pelo menos 8 caracteres.')
    expect(screen.getByLabelText('Email')).toHaveValue('ana@exemplo.com')
  })

  it('announces errors that are not about a single field', async () => {
    const user = userEvent.setup()
    const action = jest.fn<FormAction>().mockResolvedValue(failed('Email ou senha incorretos.'))
    renderWithIntl(<CredentialsForm action={action} mode="sign-in" />)

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha incorretos.')
  })

  it('suggests a strong password only when creating an account', () => {
    const { unmount } = renderWithIntl(
      <CredentialsForm action={jest.fn<FormAction>()} mode="sign-up" />,
    )
    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription(
      'Pelo menos 8 caracteres, com letras e números.',
    )
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'new-password')
    unmount()

    renderWithIntl(<CredentialsForm action={jest.fn<FormAction>()} mode="sign-in" />)
    expect(screen.getByLabelText('Senha')).not.toHaveAccessibleDescription()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password')
  })

  it('speaks English to an English visitor', () => {
    renderWithIntl(<CredentialsForm action={jest.fn<FormAction>()} mode="sign-up" />, {
      locale: 'en-US',
    })

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'At least 8 characters, with letters and numbers.',
    )
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })
})
