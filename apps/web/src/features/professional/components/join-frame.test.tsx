import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { JoinFrame } from './join-frame'

describe('JoinFrame', () => {
  it('lets a signed-in person leave before sending the registration', async () => {
    const signOut = jest.fn<() => Promise<void>>(() => Promise.resolve())
    renderWithIntl(
      <JoinFrame signOut={signOut}>
        <p>Formulário</p>
      </JoinFrame>,
    )

    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }))

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('main')).toHaveTextContent('Formulário')
  })

  it('shows no way out when there is nothing to leave', () => {
    renderWithIntl(
      <JoinFrame>
        <p>Formulário</p>
      </JoinFrame>,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('speaks the language of the person', () => {
    const signOut = jest.fn<() => Promise<void>>(() => Promise.resolve())
    renderWithIntl(
      <JoinFrame signOut={signOut}>
        <p>Form</p>
      </JoinFrame>,
      { locale: 'pt-PT' },
    )

    expect(screen.getByRole('button', { name: 'Terminar sessão' })).toBeInTheDocument()
  })
})
