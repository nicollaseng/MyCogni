import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { failed, type FormState } from '../form-state'
import { GoogleSignIn } from './google-sign-in'

describe('GoogleSignIn', () => {
  it('offers Google before the email form', () => {
    render(<GoogleSignIn action={jest.fn<(state: FormState) => Promise<FormState>>()} />)

    expect(screen.getByRole('button', { name: 'Continuar com o Google' })).toBeInTheDocument()
    expect(screen.getByText('ou com email')).toBeInTheDocument()
  })

  it('starts the Google sign in when pressed', async () => {
    const action = jest
      .fn<(state: FormState) => Promise<FormState>>()
      .mockResolvedValue(failed('Não foi possível abrir o Google.'))
    render(<GoogleSignIn action={action} />)

    await userEvent.click(screen.getByRole('button', { name: 'Continuar com o Google' }))

    expect(action).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir o Google.')
  })
})
