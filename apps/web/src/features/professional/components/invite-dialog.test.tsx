import { beforeAll, describe, expect, it, jest } from '@jest/globals'
import type { CreatedInvitation } from '@mycogni/contracts'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { InviteInput } from '../invites'
import { invitation } from '../test-data'
import { InviteDialog } from './invite-dialog'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

const created: CreatedInvitation = {
  invitation: invitation({ channel: 'link', recipientEmail: null }),
  emailSent: false,
}

function renderDialog(defaultOpen = false) {
  const invite = jest.fn<(input: InviteInput) => Promise<ActionResult<CreatedInvitation>>>(() =>
    Promise.resolve({ ok: true, value: created }),
  )
  const user = userEvent.setup()
  renderWithIntl(
    <InviteDialog invite={invite} timeZone="America/Sao_Paulo" defaultOpen={defaultOpen} />,
  )
  return { invite, user }
}

describe('InviteDialog', () => {
  it('opens the invitation form from the page header and closes it again', async () => {
    const { user } = renderDialog()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Novo convite' }))

    expect(screen.getByRole('dialog', { name: 'Novo convite' })).toBeVisible()
    expect(screen.getByLabelText('Email do paciente')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('creates a link and keeps it at hand to copy', async () => {
    const { invite, user } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Novo convite' }))
    await user.click(screen.getByRole('radio', { name: 'Por link' }))
    await user.click(screen.getByRole('button', { name: 'Criar link' }))

    expect(invite).toHaveBeenCalledWith({ channel: 'link' })
    expect(
      await screen.findByText('Link criado. Copie e envie para a pessoa por onde preferir.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Link do convite')).toHaveValue(created.invitation.link)
  })

  it('starts a fresh form every time it opens', async () => {
    const { user } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Novo convite' }))
    await user.type(screen.getByLabelText('Email do paciente'), 'marina@exemplo.com')
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Novo convite' }))

    expect(screen.getByLabelText('Email do paciente')).toHaveValue('')
  })

  it('opens right away when the page is reached from an invite shortcut', () => {
    renderDialog(true)

    expect(screen.getByRole('dialog', { name: 'Novo convite' })).toBeVisible()
  })
})
