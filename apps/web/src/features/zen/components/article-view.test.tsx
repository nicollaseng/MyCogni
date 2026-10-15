import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { ArticleView } from './article-view'

describe('ArticleView', () => {
  it('shows the article with its reading time, disclaimer and references', () => {
    renderWithIntl(<ArticleView id="worry-time" />)

    expect(screen.getByRole('heading', { level: 1, name: 'A hora da preocupação' })).toBeVisible()
    expect(screen.getByText(/^Leitura · \d min$/)).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Como experimentar' })).toBeVisible()
    expect(
      screen.getByText('Conteúdo educativo, não substitui acompanhamento profissional.'),
    ).toBeVisible()

    const references = within(screen.getByRole('region', { name: 'Referências' }))
    const items = references.getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent(
      'Borkovec TD, Wilkinson L, Folensbee R, Lerman C. Stimulus control applications to the treatment of worry.',
    )
    expect(references.getAllByRole('link')[0]).toHaveAttribute(
      'href',
      'https://pubmed.ncbi.nlm.nih.gov/6615390/',
    )
    expect(screen.getByRole('link', { name: 'Sono e descanso' })).toHaveAttribute(
      'href',
      '/zen/tracks/sleep-and-rest',
    )
  })

  it('adds the local crisis lines to the article about seeking help', () => {
    renderWithIntl(<ArticleView id="when-to-seek-help" />, { locale: 'pt-PT' })

    expect(screen.getByRole('heading', { level: 1, name: 'Quando procurar ajuda' })).toBeVisible()
    const help = within(screen.getByRole('region', { name: 'Contactos de ajuda' }))
    expect(help.getByRole('link', { name: '808 24 24 24' })).toHaveAttribute(
      'href',
      'tel:808242424',
    )
    expect(help.getByRole('link', { name: '112' })).toBeVisible()
  })

  it('reads in English for both English locales', () => {
    renderWithIntl(<ArticleView id="sleep-and-mood" />, { locale: 'en-US' })

    expect(screen.getByRole('heading', { level: 1, name: 'Sleep and mood' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'References' })).toBeVisible()
  })
})
