import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { PatientAccountNotice } from './patient-account-notice'

const signOut = jest.fn<() => Promise<void>>(() => Promise.resolve())

describe('PatientAccountNotice', () => {
  it('explains that the account is a patient one and offers a separate professional account', () => {
    renderWithIntl(<PatientAccountNotice signOut={signOut} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Esta conta é de paciente.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Para atender como profissional, crie uma conta profissional com outro email.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Sair e criar conta profissional' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para o app' })).toHaveAttribute(
      'href',
      '/today',
    )
  })

  it('speaks the language of the person', () => {
    renderWithIntl(<PatientAccountNotice signOut={signOut} />, { locale: 'en-GB' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'This is a patient account.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Sign out and create a professional account' }),
    ).toBeInTheDocument()
  })
})
