import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { ProfileMenu } from './profile-menu'

function renderMenu() {
  const signOut = jest.fn<() => Promise<void>>(() => Promise.resolve())
  const user = userEvent.setup()
  renderWithIntl(
    <>
      <ProfileMenu name="Helena Duarte" profession="Psicologia" photoUrl={null} signOut={signOut} />
      <p>Fora do menu</p>
    </>,
  )
  return { user }
}

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: /Helena Duarte/ })
}

describe('ProfileMenu', () => {
  it('opens the account menu from the name and focuses the first entry', async () => {
    const { user } = renderMenu()

    expect(trigger()).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger())

    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: 'Conta' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/pro/settings',
    )
    expect(screen.getByRole('menuitem', { name: 'Configurações' })).toHaveFocus()
    expect(screen.getByRole('menuitem', { name: 'Suporte' })).toHaveAttribute(
      'href',
      '/pro/settings#support',
    )
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })

  it('keeps the photo on the button and lists only the entries in the open menu', async () => {
    const { user } = renderMenu()

    await user.click(trigger())

    const menu = screen.getByRole('menu', { name: 'Conta' })
    expect(menu.querySelector('img')).toBeNull()
    expect(menu).not.toHaveTextContent('HD')
    expect(trigger()).toHaveTextContent('HD')
  })

  it('moves between entries with the arrow keys', async () => {
    const { user } = renderMenu()

    await user.click(trigger())
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menuitem', { name: 'Suporte' })).toHaveFocus()

    await user.keyboard('{ArrowDown}{ArrowDown}')

    expect(screen.getByRole('menuitem', { name: 'Configurações' })).toHaveFocus()

    await user.keyboard('{End}')

    expect(screen.getByRole('menuitem', { name: 'Sair' })).toHaveFocus()
  })

  it('closes with Escape and gives the focus back to the name', async () => {
    const { user } = renderMenu()

    await user.click(trigger())
    await user.keyboard('{Escape}')

    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveFocus()
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('closes when clicking elsewhere', async () => {
    const { user } = renderMenu()

    await user.click(trigger())
    await user.click(screen.getByText('Fora do menu'))

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })
})
