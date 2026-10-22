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
  it('shows the name next to the photo button', () => {
    renderWithIntl(
      <ProfileHeader
        name="Marina Alves"
        email="marina@exemplo.com"
        photoUrl="https://exemplo.com/marina.jpg"
        onPhotoSaved={onPhotoSaved}
        transport={transport}
      />,
    )

    expect(screen.getByText('Marina Alves')).toBeInTheDocument()
    expect(screen.getByText('marina@exemplo.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Foto do perfil' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Trocar foto')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover foto' })).not.toBeInTheDocument()
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

    expect(screen.getByText('Perfil')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fotografia do perfil' })).toBeInTheDocument()
  })
})
