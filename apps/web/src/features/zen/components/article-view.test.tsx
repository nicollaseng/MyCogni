import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { ArticleView } from './article-view'

describe('ArticleView', () => {
  it('shows the article with its reading time and a single footnote', () => {
    renderWithIntl(<ArticleView id="worry-time" />)

    expect(screen.getByRole('heading', { level: 1, name: 'A hora da preocupação' })).toBeVisible()
    expect(screen.getByText(/^Leitura · \d min$/)).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Como experimentar' })).toBeVisible()
    expect(
      screen.getAllByText('Conteúdo educativo. Não substitui acompanhamento profissional.'),
    ).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Sono e descanso' })).toHaveAttribute(
      'href',
      '/zen/tracks/sleep-and-rest',
    )
  })

  it('keeps the sources folded until the person asks for them', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ArticleView id="worry-time" />)
    const toggle = screen.getByRole('button', { name: 'Fontes' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)

    const sources = within(screen.getByRole('list', { name: 'Fontes' }))
    expect(sources.getAllByRole('listitem')).toHaveLength(5)
    expect(sources.getAllByRole('link')[0]).toHaveAttribute(
      'href',
      'https://pubmed.ncbi.nlm.nih.gov/6615390/',
    )
  })

  it('hides the listen button when there is no narration yet', () => {
    renderWithIntl(<ArticleView id="worry-time" />)

    expect(screen.queryByRole('button', { name: /Ouvir/ })).not.toBeInTheDocument()
  })

  it('offers to listen at the top when the narration exists', () => {
    renderWithIntl(
      <ArticleView
        id="worry-time"
        narration={[{ voice: 'jessica', url: 'https://storage.test/worry.mp3' }]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Ouvir: A hora da preocupação' })).toBeVisible()
    expect(document.querySelector('audio')).toHaveAttribute('src', 'https://storage.test/worry.mp3')
  })

  it('puts listening first and then the ways to share, right under the lead', () => {
    renderWithIntl(
      <ArticleView
        id="worry-time"
        narration={[{ voice: 'jessica', url: 'https://storage.test/worry.mp3' }]}
        shareUrl="http://localhost:3400/articles/worry-time"
      />,
    )

    const listen = screen.getByRole('button', { name: 'Ouvir: A hora da preocupação' })
    const whatsapp = screen.getByRole('link', { name: 'Compartilhar no WhatsApp' })
    const lead = screen.getByText(/^Uma técnica simples para quando a preocupação/)
    expect(lead.compareDocumentPosition(listen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(listen.compareDocumentPosition(whatsapp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('leaves out the ways to share when there is no public link', () => {
    renderWithIntl(<ArticleView id="worry-time" />)

    expect(screen.queryByRole('link', { name: 'Compartilhar no WhatsApp' })).not.toBeInTheDocument()
  })

  it('adds the local crisis lines to the article about seeking help', () => {
    renderWithIntl(<ArticleView id="when-to-seek-help" />, { locale: 'pt-PT' })

    expect(screen.getByRole('heading', { level: 1, name: 'Quando procurar ajuda' })).toBeVisible()
    const help = within(screen.getByRole('region', { name: 'Apoio agora' }))
    expect(help.getByRole('link', { name: /808 24 24 24/ })).toHaveAttribute(
      'href',
      'tel:808242424',
    )
    expect(help.getByRole('link', { name: /112/ })).toBeVisible()
  })

  it('reads in English for both English locales', () => {
    renderWithIntl(<ArticleView id="sleep-and-mood" />, { locale: 'en-US' })

    expect(screen.getByRole('heading', { level: 1, name: 'Sleep and mood' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sources' })).toBeVisible()
  })
})
