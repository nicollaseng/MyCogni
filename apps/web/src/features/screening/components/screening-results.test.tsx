import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { assessmentOf } from '@/features/onboarding/test/fixtures'
import { renderWithIntl } from '@/test/render'
import { ScreeningResults } from './screening-results'

const depression = assessmentOf({
  totalScore: 16,
  severity: 'moderately_severe',
  hasRiskFlag: true,
})
const anxiety = assessmentOf({
  instrument: 'gad7',
  totalScore: 4,
  maxScore: 21,
  severity: 'minimal',
})
const before = '2026-10-01T13:00:00Z'

describe('ScreeningResults', () => {
  it('shows score, band, guidance and the change since last time', () => {
    renderWithIntl(
      <ScreeningResults
        depression={depression}
        anxiety={anxiety}
        previous={{
          depression: assessmentOf({ totalScore: 15, completedAt: before }),
          anxiety: assessmentOf({ instrument: 'gad7', totalScore: 4, completedAt: before }),
          timeZone: 'America/Sao_Paulo',
        }}
      />,
    )

    const phq9 = screen.getByRole('region', { name: 'Sinais de depressão' })
    expect(phq9).toHaveTextContent('16de 27Moderadamente grave')
    expect(phq9).toHaveTextContent('Recomendamos conversar com um profissional de saúde em breve.')
    expect(phq9).toHaveTextContent('1 ponto a mais que em 1 de outubro')
    expect(screen.getByRole('region', { name: 'Sinais de ansiedade' })).toHaveTextContent(
      'Igual a 1 de outubro',
    )
    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
  })

  it('speaks American English and points to the US crisis lines', () => {
    renderWithIntl(
      <ScreeningResults
        depression={depression}
        anxiety={anxiety}
        previous={{
          depression: assessmentOf({ totalScore: 19, completedAt: before }),
          timeZone: 'America/New_York',
        }}
      />,
      { locale: 'en-US' },
    )

    const phq9 = screen.getByRole('region', { name: 'Signs of depression' })
    expect(phq9).toHaveTextContent('16of 27Moderately severe')
    expect(phq9).toHaveTextContent('3 points lower than on October 1')
    expect(screen.getByRole('region', { name: 'Signs of anxiety' })).toHaveTextContent('Minimal')
    expect(screen.getByText('If you think about hurting yourself again, call:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '988' })).toHaveAttribute('href', 'tel:988')
    expect(screen.queryByRole('link', { name: '188' })).not.toBeInTheDocument()
  })
})
