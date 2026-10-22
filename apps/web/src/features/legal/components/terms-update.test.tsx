import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { TermsUpdate } from './terms-update'

const signOut = jest.fn<() => Promise<void>>()

describe('TermsUpdate', () => {
  it('explains the memories and accepts the new terms once they are checked', async () => {
    const accept = jest
      .fn<() => Promise<ActionResult<null>>>()
      .mockResolvedValue({ ok: true, value: null })
    renderWithIntl(<TermsUpdate accept={accept} signOut={signOut} />)
    const user = userEvent.setup()

    expect(screen.getByRole('heading', { level: 1, name: 'Atualizamos os termos' })).toBeVisible()
    expect(screen.getByText(/o Cogni pode guardar memórias/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Termos de uso' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    const button = screen.getByRole('button', { name: 'Aceitar' })
    expect(button).toBeDisabled()

    await user.click(screen.getByRole('checkbox'))
    await user.click(button)

    expect(accept).toHaveBeenCalled()
  })

  it('shows why it could not save', async () => {
    renderWithIntl(
      <TermsUpdate
        accept={() => Promise.resolve({ ok: false, error: 'Tente de novo.' })}
        signOut={signOut}
      />,
      { locale: 'en-US' },
    )
    const user = userEvent.setup()

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tente de novo.')
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })
})
