import { beforeAll, describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { MobileMenu } from './mobile-menu'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

function renderMenu() {
  const signOut = jest.fn<() => Promise<void>>(() => Promise.resolve())
  const user = userEvent.setup()
  renderWithIntl(
    <MobileMenu name="Helena Duarte" profession="Psicologia" verified={false} signOut={signOut} />,
  )
  return { user }
}

describe('MobileMenu', () => {
  it('opens the drawer from the menu button with the account entries', async () => {
    const { user } = renderMenu()
    const button = screen.getByRole('button', { name: 'Abrir menu' })

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    const drawer = screen.getByRole('dialog', { name: 'Área profissional' })
    expect(drawer).toBeVisible()
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveFocus()
    expect(screen.getByText('Helena Duarte')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/pro/settings',
    )
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('slides closed and only then hides the drawer', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await user.click(screen.getByRole('button', { name: 'Fechar menu' }))

    expect(screen.getByRole('dialog')).toHaveAttribute('data-closing')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
