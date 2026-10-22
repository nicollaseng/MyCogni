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
  it('shows a plain level, guidance and the change in words, with no scores', () => {
    const { container } = renderWithIntl(
      <ScreeningResults
        depression={depression}
        anxiety={anxiety}
        previous={{
          depression: assessmentOf({ totalScore: 12, severity: 'moderate', completedAt: before }),
          anxiety: assessmentOf({
            instrument: 'gad7',
            totalScore: 3,
            severity: 'minimal',
            completedAt: before,
          }),
        }}
      />,
    )

    const mood = screen.getByRole('region', { name: 'Desânimo' })
    expect(mood).toHaveTextContent('DesânimoAlto')
    expect(mood).toHaveTextContent('Recomendamos conversar com um profissional de saúde em breve.')
    expect(mood).toHaveTextContent('Mais alto que da última vez')
    const worry = screen.getByRole('region', { name: 'Ansiedade' })
    expect(worry).toHaveTextContent('AnsiedadeBaixo')
    expect(worry).toHaveTextContent('Igual à última vez')
    expect(container).not.toHaveTextContent(/PHQ|GAD|de 27|de 21|pontos?/)
    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
  })

  it('says when the level went down and leaves out the change the first time', () => {
    renderWithIntl(
      <ScreeningResults
        depression={assessmentOf({ totalScore: 6, severity: 'mild' })}
        anxiety={anxiety}
        previous={{
          depression: assessmentOf({ totalScore: 12, severity: 'moderate', completedAt: before }),
        }}
      />,
    )

    expect(screen.getByRole('region', { name: 'Desânimo' })).toHaveTextContent(
      'DesânimoLeveVale observar como isso muda nas próximas semanas.Melhor que da última vez',
    )
    expect(screen.getByRole('region', { name: 'Ansiedade' })).not.toHaveTextContent(/última vez/)
  })

  it('speaks American English and points to the US crisis lines', () => {
    renderWithIntl(<ScreeningResults depression={depression} anxiety={anxiety} />, {
      locale: 'en-US',
    })

    expect(screen.getByRole('region', { name: 'Feeling down' })).toHaveTextContent(
      'Feeling downHigh',
    )
    expect(screen.getByRole('region', { name: 'Anxiety' })).toHaveTextContent('AnxietyLow')
    expect(screen.getByText('If you think about hurting yourself again, call:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '988' })).toHaveAttribute('href', 'tel:988')
    expect(screen.queryByRole('link', { name: '188' })).not.toBeInTheDocument()
  })

  it('reads a calm short screen as low and keeps the help close when the safety answer is above zero', () => {
    const { container } = renderWithIntl(
      <ScreeningResults
        depression={assessmentOf({
          instrument: 'phq2',
          totalScore: 1,
          maxScore: 6,
          severity: 'minimal',
          hasRiskFlag: true,
        })}
        anxiety={assessmentOf({
          instrument: 'gad2',
          totalScore: 2,
          maxScore: 6,
          severity: 'minimal',
        })}
      />,
    )

    expect(screen.getByRole('region', { name: 'Desânimo' })).toHaveTextContent('DesânimoBaixo')
    expect(screen.getByRole('region', { name: 'Ansiedade' })).toHaveTextContent('AnsiedadeBaixo')
    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
    expect(container).not.toHaveTextContent(/PHQ|GAD|de 6/)
  })
})
