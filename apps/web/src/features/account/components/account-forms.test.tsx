import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { DeleteAccount } from './delete-account'
import { EmailForm } from './email-form'
import { NameForm } from './name-form'
import { PasswordForm } from './password-form'
import { SettingsRow } from './settings-row'

function done(message: string): Promise<ActionResult<string>> {
  return Promise.resolve({ ok: true, value: message })
}

describe('SettingsRow', () => {
  it('shows the current value and opens the form only when asked', async () => {
    renderWithIntl(
      <SettingsRow label="Nome" value="Marina">
        <p>formulário</p>
      </SettingsRow>,
    )

    expect(screen.getByText('Marina')).toBeInTheDocument()
    expect(screen.queryByText('formulário')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Alterar nome' }))

    expect(screen.getByText('formulário')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})

describe('NameForm', () => {
  it('saves the new name and closes the row', async () => {
    const rename = jest.fn((name: string) => done(`ok ${name}`))
    renderWithIntl(
      <SettingsRow label="Nome" value="Marina">
        <NameForm initialName="Marina" rename={rename} />
      </SettingsRow>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Alterar nome' }))

    await userEvent.clear(screen.getByLabelText('Novo nome'))
    await userEvent.type(screen.getByLabelText('Novo nome'), 'Mari')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(rename).toHaveBeenCalledWith('Mari')
    expect(screen.queryByLabelText('Novo nome')).not.toBeInTheDocument()
  })
})

describe('EmailForm', () => {
  it('tells the person to confirm the new address', async () => {
    const changeEmail = jest.fn<(email: string) => Promise<ActionResult<string>>>(() =>
      done('Enviamos um link para o novo email.'),
    )
    renderWithIntl(<EmailForm changeEmail={changeEmail} />)

    await userEvent.type(screen.getByLabelText('Novo email'), 'nova@exemplo.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar confirmação' }))

    expect(changeEmail).toHaveBeenCalledWith('nova@exemplo.com')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Enviamos um link para o novo email.',
    )
  })
})

describe('PasswordForm', () => {
  it('asks for the current password and clears both fields after saving', async () => {
    const changePassword = jest.fn<
      (input: { current: string; next: string }) => Promise<ActionResult<string>>
    >(() => done('Senha alterada.'))
    renderWithIntl(<PasswordForm changePassword={changePassword} />)

    await userEvent.type(screen.getByLabelText('Senha atual'), 'antiga-2026')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'nova-senha-2026')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(changePassword).toHaveBeenCalledWith({ current: 'antiga-2026', next: 'nova-senha-2026' })
    expect(await screen.findByRole('status')).toHaveTextContent('Senha alterada.')
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
  })

  it('shows why the change was refused', async () => {
    const changePassword = jest.fn<
      (input: { current: string; next: string }) => Promise<ActionResult<string>>
    >(() => Promise.resolve({ ok: false, error: 'A senha atual não confere.' }))
    renderWithIntl(<PasswordForm changePassword={changePassword} />)

    await userEvent.type(screen.getByLabelText('Senha atual'), 'errada')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'nova-senha-2026')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A senha atual não confere.')
  })
})

describe('DeleteAccount', () => {
  it('only deletes after the person types EXCLUIR', async () => {
    const remove = jest.fn<(confirmation: string) => Promise<ActionResult<null>>>(() =>
      Promise.resolve({ ok: true, value: null }),
    )
    renderWithIntl(<DeleteAccount remove={remove} />)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    const confirm = screen.getByRole('button', { name: 'Excluir para sempre' })
    expect(confirm).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Digite EXCLUIR para confirmar'), 'excluir')
    await userEvent.click(confirm)

    expect(remove).toHaveBeenCalledWith('excluir')
  })

  it('can be called off', async () => {
    renderWithIntl(
      <DeleteAccount remove={jest.fn<(value: string) => Promise<ActionResult<null>>>()} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('button', { name: 'Excluir minha conta' })).toBeInTheDocument()
  })
})

describe('in other languages', () => {
  it('uses the European Portuguese words for the password and the deletion', async () => {
    const remove = jest.fn<(confirmation: string) => Promise<ActionResult<null>>>(() =>
      Promise.resolve({ ok: true, value: null }),
    )
    renderWithIntl(
      <>
        <SettingsRow label="Palavra-passe" value="••••••••">
          <PasswordForm changePassword={() => done('Palavra-passe alterada.')} />
        </SettingsRow>
        <DeleteAccount remove={remove} />
      </>,
      { locale: 'pt-PT' },
    )

    await userEvent.click(screen.getByRole('button', { name: 'Alterar palavra-passe' }))
    expect(screen.getByLabelText('Palavra-passe atual')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar nova palavra-passe' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar a minha conta' }))
    const confirm = screen.getByRole('button', { name: 'Eliminar para sempre' })
    await userEvent.type(screen.getByLabelText('Escreva ELIMINAR para confirmar'), 'excluir')
    expect(confirm).toBeDisabled()

    await userEvent.clear(screen.getByLabelText('Escreva ELIMINAR para confirmar'))
    await userEvent.type(screen.getByLabelText('Escreva ELIMINAR para confirmar'), 'eliminar')
    await userEvent.click(confirm)

    expect(remove).toHaveBeenCalledWith('eliminar')
  })

  it('speaks English when renaming', async () => {
    const rename = jest.fn((name: string) => done(`ok ${name}`))
    renderWithIntl(
      <SettingsRow label="Name" value="Marina">
        <NameForm initialName="Marina" rename={rename} />
      </SettingsRow>,
      { locale: 'en-US' },
    )

    await userEvent.click(screen.getByRole('button', { name: 'Change name' }))
    await userEvent.clear(screen.getByLabelText('New name'))
    await userEvent.type(screen.getByLabelText('New name'), 'Mari')
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }))

    expect(rename).toHaveBeenCalledWith('Mari')
    expect(screen.getByRole('button', { name: 'Change name' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
