import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@mycogni/domain'
import { renderWithIntl } from '@/test/render'
import { AccountMenu } from './account-menu'

interface RenderOptions {
  photoUrl?: string | null
  locale?: Locale
}

function renderMenu({ photoUrl = null, locale = 'pt-BR' }: RenderOptions = {}) {
  const signOut = jest.fn<() => Promise<void>>(() => Promise.resolve())
  const user = userEvent.setup()
  renderWithIntl(
    <>
      <AccountMenu
        name="Marina Alves Costa"
        email="marina@exemplo.com"
        photoUrl={photoUrl}
        signOut={signOut}
      />
      <p>Fora do menu</p>
    </>,
    { locale },
  )
  return { user, signOut }
}

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: 'Sua conta' })
}

describe('AccountMenu', () => {
  it('shows the initials of the person and keeps the menu closed', () => {
    renderMenu()

    expect(trigger()).toHaveTextContent('MC')
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).not.toHaveAttribute('aria-controls')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows the photo instead of the initials when there is one', () => {
    renderMenu({ photoUrl: 'https://example.com/marina.png' })

    expect(trigger().querySelector('img')).toHaveAttribute('src', 'https://example.com/marina.png')
    expect(trigger()).not.toHaveTextContent('MC')
  })

  it('opens with the name, the email and the account entries, focusing the first one', async () => {
    const { user } = renderMenu()

    await user.click(trigger())

    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    const controlled = document.getElementById(trigger().getAttribute('aria-controls') ?? '')
    expect(controlled).toHaveTextContent('Marina Alves Costa')
    expect(controlled).toHaveTextContent('marina@exemplo.com')
    expect(screen.getByRole('menu', { name: 'Conta' })).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Perfil e configurações',
      'Profissionais',
      'Ajuda agora',
      'Sair',
    ])
    expect(screen.getByRole('menuitem', { name: 'Perfil e configurações' })).toHaveAttribute(
      'href',
      '/me',
    )
    expect(screen.getByRole('menuitem', { name: 'Profissionais' })).toHaveAttribute(
      'href',
      '/me#professionals',
    )
    expect(screen.getByRole('menuitem', { name: 'Perfil e configurações' })).toHaveFocus()
  })

  it('moves between entries with the keyboard and opens from the arrow keys', async () => {
    const { user } = renderMenu()

    trigger().focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Perfil e configurações' })).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Profissionais' })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Perfil e configurações' })).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('menuitem', { name: 'Perfil e configurações' })).toHaveFocus()
  })

  it('closes with Escape and gives the focus back to the account button', async () => {
    const { user } = renderMenu()

    await user.click(trigger())
    await user.keyboard('{Escape}')

    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveFocus()
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('closes when clicking elsewhere or following an entry', async () => {
    const { user } = renderMenu()

    await user.click(trigger())
    await user.click(screen.getByText('Fora do menu'))
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    await user.click(trigger())
    screen.getByRole('menuitem', { name: 'Profissionais' }).addEventListener('click', (event) => {
      event.preventDefault()
    })
    await user.click(screen.getByRole('menuitem', { name: 'Profissionais' }))
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the crisis lines of the country inside the menu', async () => {
    const { user } = renderMenu()

    await user.click(trigger())
    const help = screen.getByRole('menuitem', { name: 'Ajuda agora' })
    expect(help).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menuitem', { name: /^188/ })).not.toBeInTheDocument()

    await user.click(help)

    expect(help).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: 'Precisa de ajuda agora?' })).toHaveTextContent(
      'Se você está em crise ou pensando em se machucar, ligue agora:',
    )
    expect(screen.getByRole('menuitem', { name: /^188/ })).toHaveAttribute('href', 'tel:188')
    expect(screen.getByRole('menuitem', { name: /^192/ })).toHaveAttribute('href', 'tel:192')

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: /^188/ })).toHaveFocus()
  })

  it('signs out from the menu', async () => {
    const { user, signOut } = renderMenu()

    await user.click(trigger())
    await user.click(screen.getByRole('menuitem', { name: 'Sair' }))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1)
    })
  })

  it('speaks European Portuguese with the lines of Portugal', async () => {
    const { user } = renderMenu({ locale: 'pt-PT' })

    await user.click(screen.getByRole('button', { name: 'A sua conta' }))
    await user.click(screen.getByRole('menuitem', { name: 'Ajuda agora' }))

    expect(screen.getByRole('menuitem', { name: 'Perfil e definições' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Terminar sessão' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /^808 24 24 24/ })).toHaveAttribute(
      'href',
      'tel:808242424',
    )
  })
})
