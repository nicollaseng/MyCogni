import { describe, expect, it, jest } from '@jest/globals'
import type { CreatedInvitation, SentInvitation } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { invitation } from '../test-data'
import { InvitationsTable } from './invitations-table'

const pending = invitation({ recipientEmail: 'marina@exemplo.com', code: 'K7M2X9QA' })
const expired = invitation({
  channel: 'link',
  recipientEmail: null,
  code: 'ZX4R8T2B',
  status: 'expired',
  expiresAt: '2026-10-12T12:00:00Z',
})
const accepted = invitation({
  recipientEmail: 'rafael@exemplo.com',
  code: 'P9Q8R7S6',
  status: 'accepted',
  respondedAt: '2026-10-16T09:00:00Z',
})
const declined = invitation({
  recipientEmail: 'ana@exemplo.com',
  code: 'D3C2B1A9',
  status: 'declined',
  respondedAt: '2026-10-16T09:00:00Z',
})

function renderTable(invitations: readonly SentInvitation[], emailSent = false) {
  const resend = jest.fn<(id: string) => Promise<ActionResult<CreatedInvitation>>>(() =>
    Promise.resolve({ ok: true, value: { invitation: pending, emailSent } }),
  )
  const cancel = jest.fn<(id: string) => Promise<ActionResult<null>>>(() =>
    Promise.resolve({ ok: true, value: null }),
  )
  const user = userEvent.setup()
  renderWithIntl(
    <InvitationsTable
      invitations={invitations}
      timeZone="America/Sao_Paulo"
      resend={resend}
      cancel={cancel}
    />,
  )
  return { resend, cancel, user }
}

function row(text: string): HTMLElement {
  const found = screen.getByText(text).closest('tr')
  if (found === null) {
    throw new Error(`No invitation for ${text}`)
  }
  return found
}

function recipients(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((line) => within(line).getAllByRole('cell')[0]?.textContent ?? '')
}

describe('InvitationsTable', () => {
  it('shows the status, dates and only the actions that still make sense', () => {
    renderTable([pending, expired, accepted])

    const open = within(row('marina@exemplo.com'))
    expect(open.getByText('Pendente')).toBeInTheDocument()
    expect(open.getByText('Código K7M2X9QA')).toBeInTheDocument()
    expect(open.getByText('Expira')).toBeInTheDocument()
    expect(
      open.getByRole('button', { name: 'Copiar link do convite (marina@exemplo.com)' }),
    ).toBeInTheDocument()
    expect(
      open.getByRole('button', { name: 'Reenviar convite (marina@exemplo.com)' }),
    ).toBeInTheDocument()
    expect(
      open.getByRole('button', { name: 'Cancelar convite (marina@exemplo.com)' }),
    ).toBeInTheDocument()

    const old = within(row('Código ZX4R8T2B'))
    expect(old.getByText('Convite por link')).toBeInTheDocument()
    expect(old.getByText('Expirado')).toBeInTheDocument()
    expect(old.getByText('Expirou')).toBeInTheDocument()
    expect(old.getByRole('button', { name: 'Gerar novo link (Código ZX4R8T2B)' })).toBeVisible()
    expect(old.queryByRole('button', { name: /Cancelar/ })).not.toBeInTheDocument()

    const done = within(row('rafael@exemplo.com'))
    expect(done.getByText('Aceito')).toBeInTheDocument()
    expect(done.getByText('Respondido')).toBeInTheDocument()
    expect(done.queryByRole('button')).not.toBeInTheDocument()
  })

  it('filters by status with a count on each chip', async () => {
    const { user } = renderTable([pending, expired, accepted, declined])

    expect(screen.getByRole('radio', { name: 'Todos 4' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Recusados 1' }))
    expect(recipients()).toEqual(['ana@exemplo.comCódigo D3C2B1A9'])

    await user.click(screen.getByRole('radio', { name: 'Cancelados 0' }))
    expect(screen.getByText('Nenhum convite corresponde ao filtro.')).toBeInTheDocument()
  })

  it('searches by email or by code', async () => {
    const { user } = renderTable([pending, expired, accepted])
    const search = screen.getByRole('searchbox', { name: 'Buscar convite' })

    await user.type(search, 'RAFAEL')
    expect(recipients()).toEqual(['rafael@exemplo.comCódigo P9Q8R7S6'])

    await user.clear(search)
    await user.type(search, 'zx4r')
    expect(recipients()).toEqual(['Convite por linkCódigo ZX4R8T2B'])
  })

  it('cancels a pending invitation', async () => {
    const { cancel, user } = renderTable([pending])

    await user.click(screen.getByRole('button', { name: 'Cancelar convite (marina@exemplo.com)' }))

    expect(cancel).toHaveBeenCalledWith(pending.id)
    expect(await screen.findByText('Convite cancelado.')).toBeInTheDocument()
  })

  it('sends a pending invitation again and says when the email did not leave', async () => {
    const { resend, user } = renderTable([pending])

    await user.click(screen.getByRole('button', { name: 'Reenviar convite (marina@exemplo.com)' }))

    expect(resend).toHaveBeenCalledWith(pending.id)
    expect(
      await screen.findByText(
        'Criamos um novo convite, mas o email não foi enviado. Copie o novo link e envie para marina@exemplo.com.',
      ),
    ).toBeInTheDocument()
  })

  it('copies the link of a pending invitation', async () => {
    const { user } = renderTable([pending])

    await user.click(
      screen.getByRole('button', { name: 'Copiar link do convite (marina@exemplo.com)' }),
    )

    expect(await navigator.clipboard.readText()).toBe(pending.link)
    expect(screen.getByText('Link copiado', { selector: 'button' })).toBeInTheDocument()
  })

  it('says when nothing was sent yet', () => {
    renderTable([])

    expect(screen.getByText('Nenhum convite enviado ainda.')).toBeInTheDocument()
  })
})
