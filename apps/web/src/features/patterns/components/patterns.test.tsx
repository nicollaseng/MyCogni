import { describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import type { ContextEffect, WeekdayMood } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import { assessmentOf } from '@/features/onboarding/test/fixtures'
import { renderWithIntl } from '@/test/render'
import { ConsistencySummary } from './consistency-summary'
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

describe('ConsistencySummary', () => {
  it('shows the days with a record and the current streak', () => {
    renderWithIntl(
      <ConsistencySummary
        consistency={{ recordedDays: 3, days: 4, currentStreak: 2 }}
        recordedDays={[true, false, true, true]}
      />,
    )

    const section = screen.getByRole('region', { name: 'Constância' })
    expect(section).toHaveTextContent('Dias com registro nos últimos 4 dias3 de 4')
    expect(section).toHaveTextContent('Sequência atual2 dias')
    expect(screen.getByRole('img', { name: '3 de 4 dias com registro' })).toBeInTheDocument()
  })

  it('names an empty streak', () => {
    renderWithIntl(
      <ConsistencySummary
        consistency={{ recordedDays: 1, days: 30, currentStreak: 0 }}
        recordedDays={[]}
      />,
      { locale: 'en-US' },
    )

    expect(screen.getByText('No days')).toBeInTheDocument()
  })
})

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
    expect(screen.getByText('Nada registrado ainda.')).toBeInTheDocument()
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

  it('describes the average of days with and without each context', () => {
    renderWithIntl(<ContextEffects effects={[effect, { ...effect, context: 'mudança' }]} />)

    expect(
      screen.getByText(/^Nos dias com exercício, seu humor médio foi 4,2; sem, 3,1\./),
    ).toHaveTextContent('(9 dias com, 21 dias sem)')
    expect(screen.getByText(/^Nos dias com mudança,/)).toBeInTheDocument()
  })

  it('speaks English', () => {
    renderWithIntl(<ContextEffects effects={[effect]} />, { locale: 'en-US' })

    expect(
      screen.getByText(/^On days with exercise, your average mood was 4\.2; without it, 3\.1\./),
    ).toBeInTheDocument()
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

  it('charts each questionnaire on its own scale with the latest result in words', () => {
    const { container } = renderWithIntl(<ScoreHistory assessments={sessions} timeZone={zone} />)

    const [depression, anxiety] = screen.getAllByRole('figure')
    expect(depression).toHaveTextContent('PHQ-9 · Sinais de depressãoÚltimo: 5 de 27, leve.')
    expect(depression).toHaveTextContent('21 de ago.: 12 de 27, moderada')
    expect(container.querySelectorAll('[data-severity]')).toHaveLength(5)
    expect(anxiety).toHaveTextContent('Último: 6 de 21, leve.Responda de novo para ver como muda.')
  })

  it('says when nothing was answered', () => {
    renderWithIntl(<ScoreHistory assessments={[]} timeZone={zone} />)

    expect(screen.getAllByText('Você ainda não respondeu os questionários.')).toHaveLength(2)
  })
})
