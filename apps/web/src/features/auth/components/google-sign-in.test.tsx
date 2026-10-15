import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { failed, type FormState } from '../form-state'
import { GoogleSignIn } from './google-sign-in'

describe('GoogleSignIn', () => {
  it('offers Google before the email form', () => {
    renderWithIntl(<GoogleSignIn action={jest.fn<(state: FormState) => Promise<FormState>>()} />)

    expect(screen.getByRole('button', { name: 'Continuar com o Google' })).toBeInTheDocument()
    expect(screen.getByText('ou com email')).toBeInTheDocument()
  })

  it('starts the Google sign in when pressed', async () => {
    const action = jest
      .fn<(state: FormState) => Promise<FormState>>()
      .mockResolvedValue(failed('Não foi possível abrir o Google.'))
    renderWithIntl(<GoogleSignIn action={action} />)

    await userEvent.click(screen.getByRole('button', { name: 'Continuar com o Google' }))

    expect(action).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir o Google.')
  })

  it('offers Google in the visitor language', () => {
    renderWithIntl(<GoogleSignIn action={jest.fn<(state: FormState) => Promise<FormState>>()} />, {
      locale: 'en-GB',
    })

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    expect(screen.getByText('or with email')).toBeInTheDocument()
  })
})
