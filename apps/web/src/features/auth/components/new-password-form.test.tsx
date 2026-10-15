import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { failed, initialFormState, type FormAction } from '../form-state'
import { NewPasswordForm } from './new-password-form'

describe('NewPasswordForm', () => {
  it('asks only for the new password, with the strength hint', () => {
    renderWithIntl(
      <NewPasswordForm action={jest.fn<FormAction>()} submitLabel="Salvar nova senha" />,
    )

    const password = screen.getByLabelText('Nova senha')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveAttribute('autocomplete', 'new-password')
    expect(password).toHaveAccessibleDescription('Pelo menos 8 caracteres, com letras e números.')
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })

  it('sends the new password to the action', async () => {
    const user = userEvent.setup()
    const action = jest.fn<FormAction>().mockResolvedValue(initialFormState)
    renderWithIntl(<NewPasswordForm action={action} submitLabel="Salvar nova senha" />)

    await user.type(screen.getByLabelText('Nova senha'), 'nova-senha-2026')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(action.mock.calls[0]?.[1].get('password')).toBe('nova-senha-2026')
  })

  it('shows the problem next to the field', async () => {
    const user = userEvent.setup()
    const action = jest.fn<FormAction>().mockResolvedValue({
      ...initialFormState,
      fieldErrors: { password: 'Use letras e números na senha.' },
    })
    renderWithIntl(<NewPasswordForm action={action} submitLabel="Salvar nova senha" />)

    await user.type(screen.getByLabelText('Nova senha'), 'somenteletras')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    const password = await screen.findByLabelText('Nova senha')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAccessibleDescription('Use letras e números na senha.')
  })

  it('announces errors that are not about the field', async () => {
    const user = userEvent.setup()
    const action = jest
      .fn<FormAction>()
      .mockResolvedValue(failed('A nova senha precisa ser diferente da anterior.'))
    renderWithIntl(<NewPasswordForm action={action} submitLabel="Salvar nova senha" />)

    await user.type(screen.getByLabelText('Nova senha'), 'senha-antiga-2026')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A nova senha precisa ser diferente da anterior.',
    )
  })

  it('speaks European Portuguese', () => {
    renderWithIntl(
      <NewPasswordForm action={jest.fn<FormAction>()} submitLabel="Guardar nova palavra-passe" />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByLabelText('Nova palavra-passe')).toHaveAccessibleDescription(
      'Pelo menos 8 caracteres, com letras e números.',
    )
    expect(screen.getByRole('button', { name: 'Guardar nova palavra-passe' })).toBeInTheDocument()
  })
})
