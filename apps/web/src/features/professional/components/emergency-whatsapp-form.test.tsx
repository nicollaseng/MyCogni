import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsRow } from '@/features/account/components/settings-row'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { EmergencyWhatsappForm } from './emergency-whatsapp-form'

type Save = (emergencyWhatsapp: string | null) => Promise<ActionResult<string | null>>

function renderRow(initial: string | null) {
  const save = jest.fn<Save>((value) => Promise.resolve({ ok: true, value }))
  const user = userEvent.setup()
  renderWithIntl(
    <SettingsRow label="WhatsApp para emergências" value={initial ?? 'Não informado'}>
      <EmergencyWhatsappForm initial={initial} save={save} />
    </SettingsRow>,
  )
  return { save, user }
}

describe('EmergencyWhatsappForm', () => {
  it('saves a Brazilian number in the international format', async () => {
    const { save, user } = renderRow(null)

    await user.click(screen.getByRole('button', { name: /Alterar/ }))
    expect(screen.getByLabelText('Código do país')).toHaveValue('+55')
    expect(
      screen.getByText(
        'Aparece para seus pacientes só quando o app identifica risco. Use um número que você acompanha.',
      ),
    ).toBeVisible()
    await user.type(screen.getByLabelText('Número'), '(11) 98765-4321')
    await user.click(screen.getByRole('button', { name: 'Salvar número' }))

    expect(save).toHaveBeenCalledWith('+5511987654321')
    await waitFor(() => {
      expect(screen.queryByLabelText('Número')).not.toBeInTheDocument()
    })
  })

  it('points out a number that cannot be dialled', async () => {
    const { save, user } = renderRow(null)

    await user.click(screen.getByRole('button', { name: /Alterar/ }))
    await user.type(screen.getByLabelText('Número'), '1234')
    await user.click(screen.getByRole('button', { name: 'Salvar número' }))

    expect(save).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Número')).toHaveAccessibleDescription(
      'Confira o número e o código do país.',
    )
  })

  it('removes a saved number', async () => {
    const { save, user } = renderRow('+5511987654321')

    await user.click(screen.getByRole('button', { name: /Alterar/ }))
    expect(screen.getByLabelText('Número')).toHaveValue('11987654321')
    await user.click(screen.getByRole('button', { name: 'Remover número' }))

    expect(save).toHaveBeenCalledWith(null)
  })
})
