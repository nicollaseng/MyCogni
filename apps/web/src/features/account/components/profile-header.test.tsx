import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import type { UploadResult } from '@/shared/lib/uploads'
import { renderWithIntl } from '@/test/render'
import type { RenderPhoto } from '../photo-canvas'
import { ProfileHeader } from './profile-header'

const transport = {
  send: jest.fn<(photo: File) => Promise<UploadResult<string | null>>>(),
  remove: jest.fn<() => Promise<UploadResult<null>>>(),
  render: jest.fn<RenderPhoto>(),
}

const onPhotoSaved = jest.fn<() => Promise<void>>()

describe('ProfileHeader', () => {
  it('shows the photo with its controls', () => {
    renderWithIntl(
      <ProfileHeader
        name="Marina Alves"
        email="marina@exemplo.com"
        photoUrl="https://exemplo.com/marina.jpg"
        onPhotoSaved={onPhotoSaved}
        transport={transport}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Marina Alves' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Sua foto' })).toBeInTheDocument()
    expect(screen.getByLabelText('Trocar foto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeInTheDocument()
  })

  it('falls back to the initials and the page name in European Portuguese', () => {
    renderWithIntl(
      <ProfileHeader
        name={null}
        email="marina@exemplo.com"
        photoUrl={null}
        onPhotoSaved={onPhotoSaved}
        transport={transport}
      />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByText('ME')).toBeInTheDocument()
    expect(screen.getByLabelText('Adicionar fotografia')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover fotografia' })).not.toBeInTheDocument()
  })
})
