import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UploadResult } from '@/shared/lib/uploads'
import { renderWithIntl } from '@/test/render'
import type { RenderPhoto } from '../photo-canvas'
import type { PhotoTransport } from '../use-photo-editing'
import { ProfilePhoto } from './profile-photo'

const current = 'https://exemplo.com/marina.jpg'

const realFetch = global.fetch

function transport(): PhotoTransport {
  return {
    send: jest
      .fn<(photo: File) => Promise<UploadResult<string | null>>>()
      .mockResolvedValue({ ok: true, value: 'https://exemplo.com/nova.jpg' }),
    remove: jest
      .fn<() => Promise<UploadResult<null>>>()
      .mockResolvedValue({ ok: true, value: null }),
    render: jest
      .fn<RenderPhoto>()
      .mockResolvedValue(new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })),
  }
}

function renderPhoto(
  photoUrl: string | null,
  fake = transport(),
  locale: 'pt-BR' | 'en-US' = 'pt-BR',
) {
  const onSaved = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  const user = userEvent.setup({ applyAccept: false })
  renderWithIntl(
    <ProfilePhoto
      initials="MA"
      alt="Foto de Marina Alves"
      photoUrl={photoUrl}
      onSaved={onSaved}
      transport={fake}
    >
      <p>Marina Alves</p>
    </ProfilePhoto>,
    { locale },
  )
  return { fake, onSaved, user }
}

describe('ProfilePhoto', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:preview')
    URL.revokeObjectURL = jest.fn<(url: string) => void>()
  })

  afterEach(() => {
    global.fetch = realFetch
    jest.restoreAllMocks()
  })

  it('shows the avatar as one button with decorative edit hints', () => {
    renderPhoto(current)

    const avatar = screen.getByRole('button', { name: 'Foto do perfil' })
    expect(avatar).toHaveAttribute('aria-haspopup', 'dialog')
    expect(avatar.querySelector('[data-overlay="hover"]')).toHaveAttribute('aria-hidden', 'true')
    expect(avatar.querySelector('[data-overlay="badge"]')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByText('Trocar foto')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover foto' })).not.toBeInTheDocument()
  })

  it('opens the photo full screen and closes it with Escape, back on the avatar', async () => {
    const { user } = renderPhoto(current)
    const avatar = screen.getByRole('button', { name: 'Foto do perfil' })

    await user.click(avatar)
    const viewer = screen.getByRole('dialog', { name: 'Foto do perfil' })
    expect(viewer).toHaveAttribute('aria-modal', 'true')
    expect(viewer).toHaveFocus()
    expect(within(viewer).getByRole('img', { name: 'Foto de Marina Alves' })).toHaveAttribute(
      'src',
      current,
    )
    expect(within(viewer).getByRole('button', { name: 'Editar' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(avatar).toHaveFocus()
  })

  it('keeps the focus inside the viewer', async () => {
    const { user } = renderPhoto(current)

    await user.click(screen.getByRole('button', { name: 'Foto do perfil' }))
    const viewer = screen.getByRole('dialog', { name: 'Foto do perfil' })
    const close = within(viewer).getByRole('button', { name: 'Fechar' })
    const remove = within(viewer).getByRole('button', { name: 'Remover' })

    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(remove).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
  })

  it('edits the current photo in the crop flow', async () => {
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' })
    const fetchPhoto = jest
      .fn<typeof fetch>()
      .mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(blob) } as Response)
    global.fetch = fetchPhoto
    const { fake, user } = renderPhoto(current)

    await user.click(screen.getByRole('button', { name: 'Foto do perfil' }))
    await user.click(screen.getByRole('button', { name: 'Editar' }))

    const editor = await screen.findByRole('dialog', { name: 'Ajustar foto' })
    expect(fetchPhoto).toHaveBeenCalledWith(current)
    expect(within(editor).getByLabelText('Escolher outra foto')).toBeInTheDocument()

    await user.click(within(editor).getByRole('button', { name: 'Usar foto' }))
    expect(fake.send).toHaveBeenCalled()
    const viewer = screen.getByRole('dialog', { name: 'Foto do perfil' })
    expect(await within(viewer).findByText('Foto atualizada.')).toBeInTheDocument()
    expect(within(viewer).getByRole('img', { name: 'Foto de Marina Alves' })).toHaveAttribute(
      'src',
      'https://exemplo.com/nova.jpg',
    )
  })

  it('says when the current photo cannot be loaded for editing', async () => {
    global.fetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('offline'))
    const { user } = renderPhoto(current)

    await user.click(screen.getByRole('button', { name: 'Foto do perfil' }))
    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(
      await screen.findByText('Não conseguimos salvar a foto agora. Tente de novo em instantes.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Ajustar foto' })).not.toBeInTheDocument()
  })

  it('asks before removing and keeps the photo when canceled', async () => {
    const { fake, user } = renderPhoto(current)

    await user.click(screen.getByRole('button', { name: 'Foto do perfil' }))
    await user.click(screen.getByRole('button', { name: 'Remover' }))
    const confirm = screen.getByRole('alertdialog', { name: 'Remover a foto do perfil?' })
    expect(confirm).toHaveFocus()

    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(fake.remove).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Foto do perfil' })).toBeInTheDocument()
  })

  it('closes only the confirmation on Escape', async () => {
    const { user } = renderPhoto(current)

    await user.click(screen.getByRole('button', { name: 'Foto do perfil' }))
    await user.click(screen.getByRole('button', { name: 'Remover' }))
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('dialog', { name: 'Foto do perfil' })).toBeInTheDocument()
  })

  it('removes the photo once confirmed and offers to add one', async () => {
    const { fake, onSaved, user } = renderPhoto(current)

    await user.click(screen.getByRole('button', { name: 'Foto do perfil' }))
    await user.click(screen.getByRole('button', { name: 'Remover' }))
    const confirm = screen.getByRole('alertdialog', { name: 'Remover a foto do perfil?' })
    await user.click(within(confirm).getByRole('button', { name: 'Remover' }))

    expect(fake.remove).toHaveBeenCalled()
    const viewer = screen.getByRole('dialog', { name: 'Foto do perfil' })
    expect(await within(viewer).findByText('Foto removida.')).toBeInTheDocument()
    expect(within(viewer).queryByRole('img')).not.toBeInTheDocument()
    expect(within(viewer).getByLabelText('Adicionar foto')).toBeInTheDocument()
    expect(onSaved).toHaveBeenCalled()

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(viewer).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows the initials and an add action when there is no photo', async () => {
    const { fake, user } = renderPhoto(null, transport(), 'en-US')

    await user.click(screen.getByRole('button', { name: 'Profile photo' }))
    const viewer = screen.getByRole('dialog', { name: 'Profile photo' })
    expect(within(viewer).getByText('MA')).toBeInTheDocument()
    expect(within(viewer).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(within(viewer).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()

    await user.upload(
      within(viewer).getByLabelText('Add photo'),
      new File(['x'], 'eu.png', { type: 'image/png' }),
    )
    const editor = screen.getByRole('dialog', { name: 'Adjust photo' })
    await user.click(within(editor).getByRole('button', { name: 'Use photo' }))
    expect(fake.send).toHaveBeenCalled()
  })
})
