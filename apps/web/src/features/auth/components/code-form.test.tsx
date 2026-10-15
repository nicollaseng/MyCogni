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

  it('asks only for the code, also when resetting the password', async () => {
    const user = userEvent.setup()
    const action = jest.fn<FormAction>().mockResolvedValue(initialFormState)
    renderWithIntl(<CodeForm action={action} submitLabel="Continuar" />)

    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Código'), '123456')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(action.mock.calls[0]?.[1].get('code')).toBe('123456')
  })

  it('shows what comes right under the code field before the main button', () => {
    renderWithIntl(
      <CodeForm action={jest.fn<FormAction>()} submitLabel="Confirmar email">
        <p>Não recebeu?</p>
      </CodeForm>,
    )

    const hint = screen.getByText('Não recebeu?')
    const button = screen.getByRole('button', { name: 'Confirmar email' })
    expect(hint.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('speaks European Portuguese', () => {
    renderWithIntl(<CodeForm action={jest.fn<FormAction>()} submitLabel="Continuar" />, {
      locale: 'pt-PT',
    })

    expect(screen.getByLabelText('Código')).toBeInTheDocument()
  })
})
