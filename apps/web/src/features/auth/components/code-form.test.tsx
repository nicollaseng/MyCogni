import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { initialFormState, type FormAction } from '../form-state'
import { CodeForm } from './code-form'

describe('CodeForm', () => {
  it('lets the phone fill the code from the email', () => {
    renderWithIntl(<CodeForm action={jest.fn<FormAction>()} submitLabel="Confirmar email" />)

    const code = screen.getByLabelText('Código')
    expect(code).toHaveAttribute('autocomplete', 'one-time-code')
    expect(code).toHaveAttribute('inputmode', 'numeric')
    expect(code).toHaveAttribute('maxlength', '6')
  })

  it('asks only for the code when confirming the email', () => {
    renderWithIntl(<CodeForm action={jest.fn<FormAction>()} submitLabel="Confirmar email" />)

    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()
  })

  it('asks for the code and a new password when resetting it', async () => {
    const user = userEvent.setup()
    const action = jest.fn<FormAction>().mockResolvedValue(initialFormState)
    renderWithIntl(<CodeForm action={action} withNewPassword submitLabel="Salvar nova senha" />)

    await user.type(screen.getByLabelText('Código'), '123456')
    await user.type(screen.getByLabelText('Nova senha'), 'nova-senha-2026')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    const formData = action.mock.calls[0]?.[1]
    expect(formData?.get('code')).toBe('123456')
    expect(formData?.get('password')).toBe('nova-senha-2026')
  })

  it('speaks European Portuguese', () => {
    renderWithIntl(
      <CodeForm action={jest.fn<FormAction>()} withNewPassword submitLabel="Guardar" />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByLabelText('Código')).toBeInTheDocument()
    expect(screen.getByLabelText('Nova palavra-passe')).toHaveAccessibleDescription(
      'Pelo menos 8 caracteres, com letras e números.',
    )
  })
})
