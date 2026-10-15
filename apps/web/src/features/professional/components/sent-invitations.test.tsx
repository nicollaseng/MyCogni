import { describe, expect, it, jest } from '@jest/globals'
import type { CreatedInvitation, SentInvitation } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { SentInvitations } from './sent-invitations'

const pending: SentInvitation = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000021',
  code: 'K7M2X9QA',
  channel: 'email',
  recipientEmail: 'marina@exemplo.com',
  status: 'pending',
  createdAt: '2026-10-15T12:00:00Z',
  expiresAt: '2026-10-18T12:00:00Z',
  respondedAt: null,
  link: 'http://localhost:3000/invite/K7M2X9QA',
}

const expired: SentInvitation = {
  ...pending,
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000022',
  channel: 'link',
  recipientEmail: null,
  status: 'expired',
}

const accepted: SentInvitation = {
  ...pending,
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000023',
  recipientEmail: 'rafael@exemplo.com',
  status: 'accepted',
  respondedAt: '2026-10-16T09:00:00Z',
}

function renderList(invitations: readonly SentInvitation[]) {
  const resend = jest.fn<(id: string) => Promise<ActionResult<CreatedInvitation>>>(() =>
    Promise.resolve({ ok: true, value: { invitation: pending, emailSent: false } }),
  )
  const cancel = jest.fn<(id: string) => Promise<ActionResult<null>>>(() =>
    Promise.resolve({ ok: true, value: null }),
  )
  const user = userEvent.setup()
  renderWithIntl(
    <SentInvitations
      invitations={invitations}
      timeZone="America/Sao_Paulo"
      resend={resend}
      cancel={cancel}
    />,
  )
  return { resend, cancel, user }
}

function row(text: string): HTMLElement {
  const item = screen.getByText(text).closest('li')
  if (item === null) {
    throw new Error(`No invitation for ${text}`)
  }
  return item
}

describe('SentInvitations', () => {
  it('shows the status of each invitation and only the actions that still make sense', () => {
    renderList([pending, expired, accepted])

    const open = within(row('marina@exemplo.com'))
    expect(open.getByText('Aguardando resposta')).toBeInTheDocument()
    expect(open.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument()
    expect(open.getByRole('button', { name: 'Reenviar' })).toBeInTheDocument()
    expect(open.getByRole('button', { name: 'Cancelar convite' })).toBeInTheDocument()

    const old = within(row('Convite por link'))
    expect(old.getByText('Expirado')).toBeInTheDocument()
    expect(old.getByRole('button', { name: 'Gerar novo link' })).toBeInTheDocument()
    expect(old.queryByRole('button', { name: 'Cancelar convite' })).not.toBeInTheDocument()

    const done = within(row('rafael@exemplo.com'))
    expect(done.getByText('Aceito')).toBeInTheDocument()
    expect(done.queryByRole('button')).not.toBeInTheDocument()
  })

  it('cancels a pending invitation', async () => {
    const { cancel, user } = renderList([pending])

    await user.click(screen.getByRole('button', { name: 'Cancelar convite' }))

    expect(cancel).toHaveBeenCalledWith(pending.id)
    expect(await screen.findByText('Convite cancelado.')).toBeInTheDocument()
  })

  it('sends a pending invitation again and says when the email did not leave', async () => {
    const { resend, user } = renderList([pending])

    await user.click(screen.getByRole('button', { name: 'Reenviar' }))

    expect(resend).toHaveBeenCalledWith(pending.id)
    expect(
      await screen.findByText(
        'Criamos um novo convite, mas o email não foi enviado. Copie o novo link e envie para marina@exemplo.com.',
      ),
    ).toBeInTheDocument()
  })

  it('copies the link of a pending invitation', async () => {
    const { user } = renderList([pending])

    await user.click(screen.getByRole('button', { name: 'Copiar link' }))

    expect(await navigator.clipboard.readText()).toBe(pending.link)
  })

  it('says when nothing was sent yet', () => {
    renderList([])

    expect(screen.getByText('Nenhum convite enviado ainda.')).toBeInTheDocument()
  })
})
