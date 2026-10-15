import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { ProfileHeader } from './profile-header'

const upload = jest.fn<(data: FormData) => Promise<ActionResult<string>>>()
const remove = jest.fn<() => Promise<ActionResult<string>>>()

describe('ProfileHeader', () => {
  it('shows the photo with its controls', () => {
    renderWithIntl(
      <ProfileHeader
        name="Marina Alves"
        email="marina@exemplo.com"
        photoUrl="https://exemplo.com/marina.jpg"
        upload={upload}
        remove={remove}
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
        upload={upload}
        remove={remove}
      />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByText('ME')).toBeInTheDocument()
    expect(screen.getByLabelText('Adicionar fotografia')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover fotografia' })).not.toBeInTheDocument()
  })
})
