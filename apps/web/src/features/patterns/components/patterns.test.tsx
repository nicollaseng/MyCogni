import { describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import type { ContextEffect, WeekdayMood } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import { assessmentOf } from '@/features/onboarding/test/fixtures'
import { renderWithIntl } from '@/test/render'
import { ContextEffects } from './context-effects'
import { FrequentTags } from './frequent-tags'
import { ScoreHistory } from './score-history'
import { WeekdayChart } from './weekday-chart'

const weekdays: WeekdayMood[] = [
  { weekday: 0, average: 4.25, days: 4 },
  { weekday: 1, average: 2.4, days: 5 },
  { weekday: 2, average: null, days: 0 },
  { weekday: 3, average: 3, days: 3 },
  { weekday: 4, average: 3.5, days: 2 },
  { weekday: 5, average: 2, days: 4 },
  { weekday: 6, average: 5, days: 3 },
]

const zone = 'America/Sao_Paulo'

describe('WeekdayChart', () => {
  it('lists the average of each weekday from Sunday in Brazil', () => {
    renderWithIntl(<WeekdayChart weekdays={weekdays} />)

    const rows = screen.getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual([
      'Dom.4,3 (4 dias)',
      'Seg.2,4 (5 dias)',
      'Ter.– (sem registro)',
      'Qua.3,0 (3 dias)',
      'Qui.3,5 (2 dias)',
      'Sex.2,0 (4 dias)',
      'Sáb.5,0 (3 dias)',
    ])
    expect(rows[0]).toHaveAttribute('title', 'Dom.: média 4,3 em 4 dias')
    expect(screen.getByText('Melhor dia: sábado · Mais difícil: sexta-feira')).toBeVisible()
  })

  it('skips the reading when there is only one weekday to compare', () => {
    renderWithIntl(
      <WeekdayChart
        weekdays={weekdays.map((day) => (day.weekday === 3 ? day : { ...day, average: null }))}
      />,
    )

    expect(screen.queryByText(/Melhor dia/)).not.toBeInTheDocument()
  })

  it('starts the week on Monday in Portugal', () => {
    renderWithIntl(<WeekdayChart weekdays={weekdays} />, { locale: 'pt-PT' })

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]?.textContent).toMatch(/^Seg/)
    expect(rows[6]?.textContent).toMatch(/^Dom/)
  })
})

describe('FrequentTags', () => {
  it('ranks emotions and contexts with how many records carry them', () => {
    renderWithIntl(
      <FrequentTags
        emotions={[
          { tag: 'anxiety', count: 12 },
          { tag: 'luto', count: 1 },
        ]}
        contexts={[]}
      />,
    )

    const emotions = screen.getAllByRole('list')[0]
    expect(emotions).toBeDefined()
    if (emotions === undefined) {
      return
    }
    expect(
      within(emotions)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['ansiedade12 registros', 'luto1 registro'])
    expect(screen.getByText('Nada marcado ainda.')).toBeInTheDocument()
  })
})

describe('ContextEffects', () => {
  const effect: ContextEffect = {
    context: 'exercise',
    withAverage: 4.2,
    withoutAverage: 3.1,
    withDays: 9,
    withoutDays: 21,
    difference: 1.1,
  }
  const heavy: ContextEffect = {
    context: 'work',
    withAverage: 2.5,
    withoutAverage: 3.6,
    withDays: 12,
    withoutDays: 18,
    difference: -1.1,
  }

  it('compares the days with and without each context, better days first', () => {
    renderWithIntl(
      <ContextEffects better={[effect, { ...effect, context: 'mudança' }]} harder={[heavy]} />,
    )

    const section = screen.getByRole('region', { name: 'O que acompanha seus dias melhores' })
    const [exercise] = within(section).getAllByRole('listitem')
    expect(exercise).toHaveTextContent('exercício4,2 com3,1 sem (9 dias com, 21 dias sem)')
    expect(section).toHaveTextContent('mudança')
    expect(within(section).getByRole('heading', { name: 'E nos dias mais difíceis' })).toBeVisible()
    expect(section).toHaveTextContent('trabalho2,5 com3,6 sem')
    expect(screen.getAllByText('Humor médio nos dias com e sem cada contexto.')).toHaveLength(1)
  })

  it('names the section after the harder days when nothing lifts the mood', () => {
    renderWithIntl(<ContextEffects better={[]} harder={[heavy]} />, { locale: 'en-US' })

    expect(
      screen.getByRole('region', { name: 'What comes with your harder days' }),
    ).toHaveTextContent('work2.5 with3.6 without')
  })
})

describe('ScoreHistory', () => {
  const sessions: Assessment[] = [
    assessmentOf({
      id: '0b7c6c8e-6a8f-4f53-9f4b-000000000011',
      totalScore: 12,
      severity: 'moderate',
      completedAt: '2026-08-21T13:00:00Z',
    }),
    assessmentOf({
      id: '0b7c6c8e-6a8f-4f53-9f4b-000000000012',
      totalScore: 5,
      severity: 'mild',
      completedAt: '2026-10-03T13:00:00Z',
    }),
    assessmentOf({
      id: '0b7c6c8e-6a8f-4f53-9f4b-000000000013',
      instrument: 'gad7',
      totalScore: 6,
      maxScore: 21,
      severity: 'mild',
      completedAt: '2026-10-03T13:00:00Z',
    }),
  ]

  it('charts the questionnaires answered at least twice on four plain levels, without scores', () => {
    const { container } = renderWithIntl(<ScoreHistory assessments={sessions} timeZone={zone} />)

    const section = screen.getByRole('region', { name: 'Ânimo e ansiedade' })
    const figures = within(section).getAllByRole('figure')
    expect(figures).toHaveLength(1)
    expect(figures[0]).toHaveTextContent('DesânimoLeve · Melhor que da última vez')
    expect(figures[0]).toHaveTextContent('21 de ago.: Moderado')
    expect(figures[0]).toHaveTextContent('3 de out.: Leve')
    expect(container.querySelectorAll('[data-level]')).toHaveLength(4)
    expect(section).not.toHaveTextContent(/PHQ|GAD|de 27|\b12\b|\b5\b/)
    expect(screen.queryByText('Ansiedade')).not.toBeInTheDocument()
  })

  it('speaks English', () => {
    renderWithIntl(<ScoreHistory assessments={sessions} timeZone={zone} />, { locale: 'en-US' })

    expect(screen.getByRole('figure')).toHaveTextContent('Feeling downMild · Better than last time')
  })
})
