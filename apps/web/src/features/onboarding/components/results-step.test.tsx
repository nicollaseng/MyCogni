import { describe, expect, it } from '@jest/globals'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  it('shows each score with its band and what it suggests', () => {
    render(
      <ResultsStep
        depression={depression}
        anxiety={anxiety}
        finish={fakeActions().finishOnboarding}
      />,
    )

    const phq9 = screen.getByRole('region', { name: 'Sinais de depressão' })
    const gad7 = screen.getByRole('region', { name: 'Sinais de ansiedade' })

    expect(phq9).toHaveTextContent('11de 27')
    expect(within(phq9).getByText('Moderados')).toBeInTheDocument()
    expect(within(phq9).getByText(/conversar com um profissional de saúde/)).toBeInTheDocument()
    expect(gad7).toHaveTextContent('4de 21')
    expect(within(gad7).getByText('Mínimos')).toBeInTheDocument()
    expect(screen.getByText(/É uma triagem, não um diagnóstico/)).toBeInTheDocument()
  })

  it('keeps the crisis lines in view when PHQ-9 item 9 was flagged', () => {
    render(
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
    render(
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
    render(
      <ResultsStep depression={depression} anxiety={anxiety} finish={actions.finishOnboarding} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Começar a usar' }))

    expect(actions.finishOnboarding).toHaveBeenCalledTimes(1)
  })
})
