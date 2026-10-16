import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { SafetyNotice } from './safety-notice'
import { SafetyPanel } from './safety-panel'

function panel(): HTMLElement {
  return screen.getByRole('region', { name: 'Apoio agora' })
}

describe('SafetyNotice', () => {
  it('says one warm sentence, lists the lines to call and names who follows the person', () => {
    renderWithIntl(<SafetyNotice prompt={{ professionals: ['Helena Prado'] }} />)

    expect(panel()).toHaveTextContent(
      'Você não precisa passar por isso sem apoio: fale com alguém agora.',
    )
    const lines = within(panel()).getByRole('list', { name: 'Atendimento agora' })
    expect(
      within(lines)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['tel:188', 'tel:192'])
    expect(panel()).toHaveTextContent('Helena Prado acompanha você.')
  })

  it('leaves out the professionals when there are none', () => {
    renderWithIntl(<SafetyNotice prompt={{ professionals: [] }} />)

    expect(panel()).not.toHaveTextContent('acompanha')
  })

  it('names every linked professional', () => {
    renderWithIntl(<SafetyNotice prompt={{ professionals: ['Helena Prado', 'Rui Lima'] }} />)

    expect(panel()).toHaveTextContent('Helena Prado e Rui Lima acompanham você.')
  })

  it('folds into “Ajuda agora” when dismissed and opens again on a tap', async () => {
    const user = userEvent.setup()
    renderWithIntl(<SafetyNotice prompt={{ professionals: [] }} />)

    await user.click(within(panel()).getByRole('button', { name: 'Fechar apoio' }))

    expect(screen.queryByRole('region', { name: 'Apoio agora' })).not.toBeInTheDocument()
    const help = screen.getByRole('button', { name: 'Ajuda agora' })
    expect(help).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(within(panel()).getByRole('link', { name: '188 CVV' })).toBeInTheDocument()
  })

  it('uses the lines of the person’s country', () => {
    const { unmount } = renderWithIntl(
      <SafetyNotice prompt={{ professionals: ['Rita Sousa'] }} />,
      { locale: 'pt-PT' },
    )
    expect(
      within(panel()).getByRole('link', { name: '808 24 24 24 SNS 24, opção 4' }),
    ).toBeVisible()
    expect(panel()).toHaveTextContent('Rita Sousa segue o seu caso.')
    unmount()

    renderWithIntl(<SafetyNotice prompt={{ professionals: [] }} />, {
      locale: 'en-GB',
    })
    const support = screen.getByRole('region', { name: 'Support now' })
    expect(within(support).getByRole('link', { name: '116 123 Samaritans' })).toHaveAttribute(
      'href',
      'tel:116123',
    )
    expect(within(support).getByRole('button', { name: 'Close support' })).toBeInTheDocument()
  })
})

describe('SafetyPanel', () => {
  it('stays gentle where the person looked for help', () => {
    renderWithIntl(<SafetyPanel level="watch" professionals={[]} />)

    expect(panel()).toHaveTextContent(
      'Se ficar pesado, tem gente pronta para ouvir você, a qualquer hora.',
    )
  })

  it('can leave the sentence to the message above it', () => {
    renderWithIntl(<SafetyPanel level="urgent" intro={false} professionals={[]} />)

    expect(panel()).not.toHaveTextContent('Você não precisa')
    expect(within(panel()).queryByRole('button')).not.toBeInTheDocument()
    expect(within(panel()).getByRole('link', { name: '188 CVV' })).toBeInTheDocument()
  })
})
