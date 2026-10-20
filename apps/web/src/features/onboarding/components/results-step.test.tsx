import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { assessmentOf, fakeActions } from '../test/fixtures'
import { ResultsStep } from './results-step'

const depression = assessmentOf({ instrument: 'phq9', totalScore: 11, severity: 'moderate' })
const anxiety = assessmentOf({
  instrument: 'gad7',
  totalScore: 4,
  maxScore: 21,
  severity: 'minimal',
})

describe('ResultsStep', () => {
  it('shows a plain level for each topic and what it suggests, without scores', () => {
    renderWithIntl(
      <ResultsStep
        depression={depression}
        anxiety={anxiety}
        finish={fakeActions().finishOnboarding}
      />,
    )

    const mood = screen.getByRole('region', { name: 'Desânimo' })
    const worry = screen.getByRole('region', { name: 'Ansiedade' })

    expect(within(mood).getByText('Moderado')).toBeInTheDocument()
    expect(within(mood).getByText(/conversar com um profissional de saúde/)).toBeInTheDocument()
    expect(within(worry).getByText('Baixo')).toBeInTheDocument()
    expect(mood).not.toHaveTextContent(/PHQ|de 27|11/)
    expect(worry).not.toHaveTextContent(/GAD|de 21/)
    expect(screen.getByText(/É uma triagem, não um diagnóstico/)).toBeInTheDocument()
  })

  it('keeps the crisis lines in view when the risk question was flagged', () => {
    renderWithIntl(
      <ResultsStep
        depression={{ ...depression, hasRiskFlag: true }}
        anxiety={anxiety}
        finish={fakeActions().finishOnboarding}
      />,
    )

    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
    expect(screen.getByRole('link', { name: '192' })).toHaveAttribute('href', 'tel:192')
  })

  it('does not bring up the crisis lines without the flag', () => {
    renderWithIntl(
      <ResultsStep
        depression={depression}
        anxiety={anxiety}
        finish={fakeActions().finishOnboarding}
      />,
    )

    expect(screen.queryByRole('link', { name: '188' })).not.toBeInTheDocument()
  })

  it('finishes onboarding', async () => {
    const actions = fakeActions()
    renderWithIntl(
      <ResultsStep depression={depression} anxiety={anxiety} finish={actions.finishOnboarding} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Começar a usar' }))

    expect(actions.finishOnboarding).toHaveBeenCalledTimes(1)
  })

  it('speaks European Portuguese', () => {
    renderWithIntl(
      <ResultsStep
        depression={depression}
        anxiety={anxiety}
        finish={fakeActions().finishOnboarding}
      />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByRole('heading', { name: 'O seu ponto de partida.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Começar a usar' })).toBeInTheDocument()
  })
})
