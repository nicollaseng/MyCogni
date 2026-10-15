import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UploadResult } from '@/shared/lib/uploads'
import { renderWithIntl } from '@/test/render'
import type { RenderPhoto } from '../photo-canvas'
import { PhotoField, type PhotoTransport } from './photo-field'

const rendered = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })

const revoke = jest.fn<(url: string) => void>()

function photo(name = 'eu.png', type = 'image/png', size = 2048): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function transport(overrides: Partial<PhotoTransport> = {}) {
  return {
    send: jest
      .fn<(photo: File) => Promise<UploadResult<string | null>>>()
      .mockResolvedValue({ ok: true, value: 'https://exemplo.com/nova.jpg' }),
    remove: jest
      .fn<() => Promise<UploadResult<null>>>()
      .mockResolvedValue({ ok: true, value: null }),
    render: jest.fn<RenderPhoto>().mockResolvedValue(rendered),
    ...overrides,
  }
}

function renderField(photoUrl: string | null, fake = transport()) {
  const onSaved = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  const user = userEvent.setup({ applyAccept: false })
  renderWithIntl(
    <PhotoField
      photoUrl={photoUrl}
      initials="MA"
      alt="Sua foto"
      onSaved={onSaved}
      transport={fake}
    />,
  )
  return { fake, onSaved, user }
}

describe('PhotoField', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:preview')
    URL.revokeObjectURL = revoke
    revoke.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('opens the editor and uploads the cropped photo it renders', async () => {
    const { fake, onSaved, user } = renderField(null)

    await user.upload(screen.getByLabelText('Adicionar foto'), photo())
    const editor = screen.getByRole('dialog', { name: 'Ajustar foto' })
    fireEvent.change(within(editor).getByLabelText('Ângulo'), { target: { value: '12' } })
    await user.click(within(editor).getByRole('button', { name: 'Girar para a direita' }))
    await user.click(within(editor).getByRole('button', { name: 'Usar foto' }))

    expect(fake.render).toHaveBeenCalledWith(expect.any(File), null, 102)
    expect(fake.send).toHaveBeenCalledWith(rendered)
    expect(await screen.findByRole('status')).toHaveTextContent('Foto atualizada.')
    expect(screen.getByRole('img', { name: 'Sua foto' })).toHaveAttribute(
      'src',
      'https://exemplo.com/nova.jpg',
    )
    expect(onSaved).toHaveBeenCalled()
  })

  it('keeps the current photo when the editor is canceled', async () => {
    const { fake, user } = renderField('https://exemplo.com/antes.jpg')

    await user.upload(screen.getByLabelText('Trocar foto'), photo())
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(fake.render).not.toHaveBeenCalled()
    expect(fake.send).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'Sua foto' })).toHaveAttribute(
      'src',
      'https://exemplo.com/antes.jpg',
    )
    expect(revoke).toHaveBeenCalledWith('blob:preview')
  })

  it('explains why a file cannot be used before opening the editor', async () => {
    const { fake, user } = renderField(null)
    const input = screen.getByLabelText('Adicionar foto')

    await user.upload(input, photo('foto.gif', 'image/gif'))
    expect(screen.getByRole('alert')).toHaveTextContent('Use uma imagem JPG, PNG ou WebP.')

    await user.upload(input, photo('enorme.jpg', 'image/jpeg', 21 * 1024 * 1024))
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma imagem de até 20 MB.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fake.send).not.toHaveBeenCalled()
  })

  it('says when the photo could not be prepared or saved', async () => {
    const render = jest
      .fn<RenderPhoto>()
      .mockRejectedValueOnce(new Error('decode'))
      .mockResolvedValue(rendered)
    const fake = transport({
      render,
      send: jest
        .fn<(photo: File) => Promise<UploadResult<string | null>>>()
        .mockResolvedValue({ ok: false, problem: 'failed' }),
    })
    const { user } = renderField(null, fake)

    await user.upload(screen.getByLabelText('Adicionar foto'), photo())
    await user.click(screen.getByRole('button', { name: 'Usar foto' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos preparar esta imagem. Tente outra foto.',
    )

    await user.click(screen.getByRole('button', { name: 'Usar foto' }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não conseguimos salvar a foto agora. Tente de novo em instantes.',
      )
    })
  })

  it('removes the photo and goes back to the initials', async () => {
    const { fake, user } = renderField('https://exemplo.com/antes.jpg')

    await user.click(screen.getByRole('button', { name: 'Remover foto' }))

    expect(fake.remove).toHaveBeenCalled()
    expect(await screen.findByRole('status')).toHaveTextContent('Foto removida.')
    expect(screen.queryByRole('img', { name: 'Sua foto' })).not.toBeInTheDocument()
    expect(screen.getByText('MA')).toBeInTheDocument()
  })
})
