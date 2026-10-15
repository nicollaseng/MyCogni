import { describe, expect, it, jest } from '@jest/globals'
import type { CreatedInvitation, SentInvitation } from '@mycogni/contracts'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { InviteInput } from '../invites'
import { InviteForm } from './invite-form'

const sent: SentInvitation = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000010',
  code: 'K7M2X9QA',
  channel: 'email',
  recipientEmail: 'marina@exemplo.com',
  status: 'pending',
  createdAt: '2026-10-15T12:00:00Z',
  expiresAt: '2026-10-18T12:00:00Z',
  respondedAt: null,
  link: 'http://localhost:3000/invite/K7M2X9QA',
}

function renderForm(created: CreatedInvitation) {
  const invite = jest.fn<(input: InviteInput) => Promise<ActionResult<CreatedInvitation>>>(() =>
    Promise.resolve({ ok: true, value: created }),
  )
  const user = userEvent.setup()
  renderWithIntl(<InviteForm invite={invite} timeZone="America/Sao_Paulo" />)
  return { invite, user }
}

describe('InviteForm', () => {
  it('sends the invitation by email and confirms who receives it', async () => {
    const { invite, user } = renderForm({ invitation: sent, emailSent: true })

    await user.type(screen.getByLabelText('Email do paciente'), ' marina@exemplo.com ')
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))

    expect(invite).toHaveBeenCalledWith({ channel: 'email', recipientEmail: 'marina@exemplo.com' })
    expect(await screen.findByText('Convite enviado para marina@exemplo.com.')).toBeInTheDocument()
    expect(screen.getByLabelText('Link do convite')).toHaveValue(sent.link)
    expect(screen.getByLabelText('Email do paciente')).toHaveValue('')
  })

  it('asks to copy the link when the email could not be sent', async () => {
    const { user } = renderForm({ invitation: sent, emailSent: false })

    await user.type(screen.getByLabelText('Email do paciente'), 'marina@exemplo.com')
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))

    expect(
      await screen.findByText(
        'Não conseguimos enviar o email agora. Copie o link e envie para marina@exemplo.com por onde preferir.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Copiar link' }))

    expect(await navigator.clipboard.readText()).toBe(sent.link)
    expect(screen.getByRole('button', { name: 'Link copiado' })).toBeInTheDocument()
  })

  it('creates a link to share without an email', async () => {
    const { invite, user } = renderForm({
      invitation: { ...sent, channel: 'link', recipientEmail: null },
      emailSent: false,
    })

    await user.click(screen.getByRole('radio', { name: 'Por link' }))

    expect(screen.queryByLabelText('Email do paciente')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Criar link' }))

    expect(invite).toHaveBeenCalledWith({ channel: 'link' })
    expect(
      await screen.findByText('Link criado. Copie e envie para a pessoa por onde preferir.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Link do convite')).toHaveValue(sent.link)
  })

  it('waits for an email before sending by email', () => {
    renderForm({ invitation: sent, emailSent: true })

    expect(screen.getByRole('button', { name: 'Enviar convite' })).toBeDisabled()
  })
})
