import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PhotoTransport } from '@/features/account/use-photo-editing'
import type { ActionResult } from '@/shared/lib/actions/result'
import type { UploadResult } from '@/shared/lib/uploads'
import { renderWithIntl } from '@/test/render'
import { ProfilePhotoStep } from './profile-photo-step'

const rendered = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })

function photo(): File {
  return new File(['x'], 'eu.png', { type: 'image/png' })
}

function renderStep(
  photoUrl: string | null,
  result: ActionResult<null> = { ok: true, value: null },
) {
  const transport: PhotoTransport = {
    send: jest
      .fn<(photo: File) => Promise<UploadResult<string | null>>>()
      .mockResolvedValue({ ok: true, value: 'https://exemplo.com/helena.jpg' }),
    remove: jest
      .fn<() => Promise<UploadResult<null>>>()
      .mockResolvedValue({ ok: true, value: null }),
    render: jest.fn<PhotoTransport['render']>().mockResolvedValue(rendered),
  }
  const finish = jest.fn<() => Promise<ActionResult<null>>>().mockResolvedValue(result)
  const onSaved = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  const user = userEvent.setup({ applyAccept: false })
  renderWithIntl(
    <ProfilePhotoStep
      name="Helena Prado"
      profession="Psicologia"
      photoUrl={photoUrl}
      onSaved={onSaved}
      finish={finish}
      transport={transport}
    />,
  )
  return { transport, finish, onSaved, user }
}

describe('ProfilePhotoStep', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:preview')
    URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('requires a photo, with no way to skip it', () => {
    const { finish, transport } = renderStep(null)

    expect(screen.getByText('Helena Prado')).toBeInTheDocument()
    expect(screen.getByLabelText('Adicionar foto')).toBeInTheDocument()
    expect(
      screen.getByText('Use uma foto recente, de frente, com boa luz e o rosto inteiro à mostra.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pular por agora' })).not.toBeInTheDocument()
    expect(finish).not.toHaveBeenCalled()
    expect(transport.send).not.toHaveBeenCalled()
  })

  it('adds a photo through the editor and then continues', async () => {
    const { finish, transport, onSaved, user } = renderStep(null)

    await user.upload(screen.getByLabelText('Adicionar foto'), photo())
    const editor = screen.getByRole('dialog', { name: 'Ajustar foto' })
    await user.click(within(editor).getByRole('button', { name: 'Usar foto' }))

    expect(transport.send).toHaveBeenCalledWith(rendered)
    expect(await screen.findByRole('img', { name: 'Foto de Helena Prado' })).toHaveAttribute(
      'src',
      'https://exemplo.com/helena.jpg',
    )
    expect(onSaved).toHaveBeenCalled()
    expect(screen.getByLabelText('Trocar foto')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(finish).toHaveBeenCalledTimes(1)
  })

  it('shows a photo that is already there, such as the one from Google, and can remove it', async () => {
    const { transport, user } = renderStep('https://exemplo.com/google.jpg')

    expect(screen.getByRole('img', { name: 'Foto de Helena Prado' })).toHaveAttribute(
      'src',
      'https://exemplo.com/google.jpg',
    )
    await user.click(screen.getByRole('button', { name: 'Remover foto' }))

    expect(transport.remove).toHaveBeenCalled()
    expect(await screen.findByLabelText('Adicionar foto')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument()
  })

  it('says when it could not move on', async () => {
    const { user } = renderStep('https://exemplo.com/helena.jpg', {
      ok: false,
      error: 'Não conseguimos seguir agora.',
    })

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos seguir agora.')
    })
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled()
  })
})
