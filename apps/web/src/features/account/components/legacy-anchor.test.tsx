import { afterEach, describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeRouter, WithRouter } from '@/test/router'
import { LegacyAnchor } from './legacy-anchor'

function visit(hash: string) {
  window.history.replaceState(null, '', `/me${hash}`)
  const router = fakeRouter()
  render(
    <WithRouter router={router}>
      <LegacyAnchor />
      <a href="/me#support">Suporte</a>
      <a href="/me#topo">Topo</a>
      <a
        href="/today#support"
        onClick={(event) => {
          event.preventDefault()
        }}
      >
        Hoje
      </a>
    </WithRouter>,
  )
  return router
}

describe('LegacyAnchor', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('sends an old anchor link to its section page', () => {
    expect(visit('#professionals').replace).toHaveBeenCalledWith('/me/professionals')
    expect(visit('#questionnaires').replace).toHaveBeenCalledWith('/me/wellbeing')
    expect(visit('#support').replace).toHaveBeenCalledWith('/me/support')
  })

  it('stays put without a known anchor', () => {
    expect(visit('').replace).not.toHaveBeenCalled()
    expect(visit('#somewhere').replace).not.toHaveBeenCalled()
  })

  it('opens the section when an old anchor link is clicked on the same page', async () => {
    const router = visit('')
    const user = userEvent.setup()

    await user.click(screen.getByRole('link', { name: 'Suporte' }))
    expect(router.push).toHaveBeenCalledWith('/me/support')

    await user.click(screen.getByRole('link', { name: 'Topo' }))
    await user.click(screen.getByRole('link', { name: 'Hoje' }))
    expect(router.push).toHaveBeenCalledTimes(1)
  })
})
