import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import type * as Navigation from 'next/navigation'
import { renderWithIntl } from '@/test/render'
import type * as Frame from './settings-frame'

const route: { segment: string | null } = { segment: null }

jest.mock('next/navigation', () => ({
  ...jest.requireActual<typeof Navigation>('next/navigation'),
  useSelectedLayoutSegment: () => route.segment,
}))

let frame: typeof Frame

beforeAll(async () => {
  frame = await import('./settings-frame')
})

function renderFrame(segment: string | null, locale: 'pt-BR' | 'en-US' = 'pt-BR') {
  route.segment = segment
  const { SettingsFrame } = frame
  renderWithIntl(
    <SettingsFrame name="Marina Alves" email="marina@exemplo.com" photoUrl={null} initials="MA">
      <p>Conteúdo da seção</p>
    </SettingsFrame>,
    { locale },
  )
  const navigations = screen.getAllByRole('navigation', {
    name: locale === 'pt-BR' ? 'Seções de perfil e configurações' : 'Profile and settings sections',
  })
  const nav = navigations.at(-1)
  if (nav === undefined) {
    throw new Error('The section navigation should render')
  }
  return {
    list: navigations.length > 1 ? navigations[0] : undefined,
    nav,
    content: screen.getByText('Conteúdo da seção').parentElement,
  }
}

function present(element: HTMLElement | undefined): HTMLElement {
  if (element === undefined) {
    throw new Error('The mobile list should render on the home')
  }
  return element
}

describe('SettingsFrame', () => {
  beforeEach(() => {
    route.segment = null
  })

  it('lists every section on the mobile home and keeps the content for wide screens', () => {
    const { list: shown, content } = renderFrame(null)
    const list = present(shown)

    expect(screen.getByRole('heading', { level: 1, name: 'Perfil e configurações' })).toBeVisible()
    const profile = within(list).getByRole('link', { name: /Marina Alves/ })
    expect(profile).toHaveAttribute('href', '/me/profile')
    expect(profile).toHaveTextContent('marina@exemplo.com')
    expect(
      within(list)
        .getAllByRole('link')
        .slice(1)
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Ânimo e ansiedade', '/me/wellbeing'],
      ['Profissionais', '/me/professionals'],
      ['Memórias', '/me/memories'],
      ['Som e voz', '/me/sound'],
      ['Privacidade e dados', '/me/privacy'],
      ['Conta', '/me/account'],
      ['Suporte', '/me/support'],
    ])
    expect(content).toHaveClass('hidden', 'lg:block')
  })

  it('marks the profile as the open section on the home for wide screens', () => {
    const { nav } = renderFrame(null)

    expect(within(nav).getByRole('link', { current: 'page' })).toHaveTextContent('Perfil')
  })

  it('marks only the open section and leaves the list for the home', () => {
    const { list, nav, content } = renderFrame('wellbeing')

    expect(list).toBeUndefined()

    const current = within(nav).getByRole('link', { current: 'page' })
    expect(current).toHaveTextContent('Ânimo e ansiedade')
    expect(current).toHaveAttribute('href', '/me/wellbeing')
    expect(within(nav).getAllByRole('link')).toHaveLength(8)
    expect(within(nav).getAllByRole('link', { current: false })).toHaveLength(7)
    expect(nav.parentElement).toHaveClass('hidden', 'lg:block')
    expect(content).not.toHaveClass('hidden')
  })

  it('leaves nothing marked for a route outside the sections', () => {
    const { nav } = renderFrame('export', 'en-US')

    expect(within(nav).queryByRole('link', { current: 'page' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Sound and voice' })).toHaveAttribute(
      'href',
      '/me/sound',
    )
  })
})
