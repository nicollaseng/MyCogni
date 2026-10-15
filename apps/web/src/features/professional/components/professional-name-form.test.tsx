import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsRow } from '@/features/account/components/settings-row'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { ProfessionalNameForm } from './professional-name-form'

function renderRow(result: ActionResult<string>) {
  const rename = jest.fn<(fullName: string) => Promise<ActionResult<string>>>(() =>
    Promise.resolve(result),
  )
  const user = userEvent.setup()
  renderWithIntl(
    <SettingsRow label="Nome exibido aos pacientes" value="Helena Duarte">
      <ProfessionalNameForm initialName="Helena Duarte" rename={rename} />
    </SettingsRow>,
  )
  return { rename, user }
}

describe('ProfessionalNameForm', () => {
  it('renames the professional and closes the row', async () => {
    const { rename, user } = renderRow({ ok: true, value: 'Dra. Helena Duarte' })

    await user.click(screen.getByRole('button', { name: /Alterar/ }))
    const field = screen.getByLabelText('Nome exibido aos pacientes')
    await user.clear(field)
    await user.type(field, 'Dra. Helena Duarte')
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(rename).toHaveBeenCalledWith('Dra. Helena Duarte')
    await waitFor(() => {
      expect(screen.queryByLabelText('Nome exibido aos pacientes')).not.toBeInTheDocument()
    })
  })

  it('needs at least three characters', async () => {
    const { user } = renderRow({ ok: true, value: '' })

    await user.click(screen.getByRole('button', { name: /Alterar/ }))
    const field = screen.getByLabelText('Nome exibido aos pacientes')
    await user.clear(field)
    await user.type(field, 'He')

    expect(screen.getByRole('button', { name: 'Salvar nome' })).toBeDisabled()
  })

  it('keeps the form open and explains when the name could not be saved', async () => {
    const { user } = renderRow({
      ok: false,
      error: 'Não conseguimos salvar agora. Tente de novo em instantes.',
    })

    await user.click(screen.getByRole('button', { name: /Alterar/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos salvar agora. Tente de novo em instantes.',
    )
    expect(screen.getByLabelText('Nome exibido aos pacientes')).toBeInTheDocument()
  })
})
