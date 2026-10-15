import { describe, expect, it } from '@jest/globals'
import { zenSuggestion } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { ArticleList } from './article-list'
import { ForYou } from './for-you'
import { TrackList } from './track-list'

describe('ForYou', () => {
  it('suggests the anxiety track and its first reads after a moderate GAD-7', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <ForYou
        suggestion={zenSuggestion({
          latest: [{ instrument: 'gad7', severity: 'moderate', hasRiskFlag: false }],
          moodAverage: 4,
        })}
        doneSteps={[]}
        professionals={[]}
      />,
    )

    const section = screen.getByRole('region', { name: 'Para você agora' })
    expect(within(section).getByRole('heading', { name: 'Ansiedade no dia a dia' })).toBeVisible()
    expect(within(section).getByText('Trilha sugerida · 0 de 6 passos')).toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Começar a trilha' })).toHaveAttribute(
      'href',
      '/zen/tracks/everyday-anxiety',
    )
    expect(
      within(section).getByRole('link', { name: 'O que é ansiedade, e o que não é' }),
    ).toHaveAttribute('href', '/zen/articles/anxiety-basics')
    expect(within(section).queryByRole('link', { name: '188' })).not.toBeInTheDocument()

    await user.click(within(section).getByRole('button', { name: 'Por que estas sugestões?' }))

    expect(
      within(section).getByText('O seu GAD-7 mais recente ficou na faixa moderada ou acima.'),
    ).toBeVisible()
  })

  it('puts help first, with crisis lines and the linked professional, after a risk answer', () => {
    renderWithIntl(
      <ForYou
        suggestion={zenSuggestion({
          latest: [{ instrument: 'phq9', severity: 'mild', hasRiskFlag: true }],
          moodAverage: null,
        })}
        doneSteps={[{ trackId: 'seeking-help', stepId: 'read-when-to-seek-help' }]}
        professionals={['Dra. Helena Prado']}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Cuide disso com alguém' })).toBeVisible()
    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
    expect(screen.getByText(/Dra\. Helena Prado acompanha os seus registros/)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Quando buscar ajuda' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Continuar a trilha' })).toHaveAttribute(
      'href',
      '/zen/tracks/seeking-help',
    )
    expect(screen.getByRole('link', { name: 'Triagem não é diagnóstico' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Quando buscar ajuda' })).not.toBeInTheDocument()
  })

  it('starts with sleep when nothing asks for attention, in European Portuguese', () => {
    renderWithIntl(
      <ForYou
        suggestion={zenSuggestion({ latest: [], moodAverage: null })}
        doneSteps={[]}
        professionals={[]}
      />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByRole('region', { name: 'Para si agora' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Sono e descanso' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Começar o percurso' })).toBeVisible()
  })
})

describe('TrackList', () => {
  it('shows every track with how far the person got', () => {
    renderWithIntl(
      <TrackList
        doneSteps={[
          { trackId: 'low-mood', stepId: 'read-behavioural-activation' },
          { trackId: 'low-mood', stepId: 'check-in' },
          ...[
            'read-when-to-seek-help',
            'support',
            'read-screening-not-diagnosis',
            'write-for-professional',
          ].map((stepId) => ({ trackId: 'seeking-help' as const, stepId })),
        ]}
      />,
    )

    const links = within(screen.getByRole('region', { name: 'Trilhas' })).getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(screen.getByRole('link', { name: /Humor para baixo/ })).toHaveTextContent(
      '2 de 5 passos',
    )
    expect(screen.getByRole('link', { name: /Quando buscar ajuda/ })).toHaveTextContent('Concluída')
    expect(screen.getByRole('link', { name: /Sono e descanso/ })).toHaveTextContent('Não iniciada')
  })
})

describe('ArticleList', () => {
  it('lists the eight reads with their reading time', () => {
    renderWithIntl(<ArticleList />, { locale: 'en-GB' })

    const links = within(screen.getByRole('region', { name: 'Reads' })).getAllByRole('link')
    expect(links).toHaveLength(8)
    expect(screen.getByRole('link', { name: /Worry time/ })).toHaveAttribute(
      'href',
      '/zen/articles/worry-time',
    )
    expect(screen.getByRole('link', { name: /Worry time/ })).toHaveTextContent(/\d min read/)
  })
})
