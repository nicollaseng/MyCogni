import { describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import { render, screen, within } from '@testing-library/react'
import { LatestScreening } from './latest-screening'

const depression: Assessment = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000001',
  instrument: 'phq9',
  totalScore: 17,
  maxScore: 27,
  severity: 'moderately_severe',
  hasRiskFlag: false,
  completedAt: '2026-10-15T03:24:00Z',
}

const anxiety: Assessment = {
  ...depression,
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000002',
  instrument: 'gad7',
  totalScore: 21,
  maxScore: 21,
  severity: 'severe',
}

describe('LatestScreening', () => {
  it('shows the last score and band of each form with the day it was answered', () => {
    render(
      <LatestScreening
        results={{ phq9: depression, gad7: anxiety }}
        timeZone="America/Sao_Paulo"
      />,
    )

    const [phq9, gad7] = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(phq9).toHaveTextContent('Sinais de depressão · PHQ-917de 27Moderadamente grave')
    expect(gad7).toHaveTextContent('Sinais de ansiedade · GAD-721de 21Grave')
    expect(screen.getByText(/Respondidos em quinta-feira, 15 de outubro\./)).toBeInTheDocument()
  })

  it('says when the forms were never answered', () => {
    render(<LatestScreening results={{}} timeZone="America/Sao_Paulo" />)

    expect(screen.getByText('Você ainda não respondeu o PHQ-9 e o GAD-7.')).toBeInTheDocument()
  })
})
