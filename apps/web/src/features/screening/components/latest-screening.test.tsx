import { describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
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
    renderWithIntl(
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
    renderWithIntl(<LatestScreening results={{}} timeZone="America/Sao_Paulo" />)

    expect(screen.getByText('Você ainda não respondeu o PHQ-9 e o GAD-7.')).toBeInTheDocument()
  })

  it('speaks English with the standard severity names', () => {
    renderWithIntl(
      <LatestScreening
        results={{ phq9: depression, gad7: anxiety }}
        timeZone="America/Sao_Paulo"
      />,
      { locale: 'en-US' },
    )

    expect(screen.getByRole('region', { name: 'Your questionnaires' })).toBeInTheDocument()
    const [phq9, gad7] = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(phq9).toHaveTextContent('Signs of depression · PHQ-917of 27Moderately severe')
    expect(gad7).toHaveTextContent('Signs of anxiety · GAD-721of 21Severe')
    expect(screen.getByText(/Answered on Thursday, October 15\./)).toBeInTheDocument()
  })

  it('uses the European Portuguese severity names in Portugal', () => {
    renderWithIntl(
      <LatestScreening
        results={{ phq9: { ...depression, totalScore: 6, severity: 'mild' } }}
        timeZone="Europe/Lisbon"
      />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByRole('listitem')).toHaveTextContent('Ligeira')
    expect(screen.getByText(/É um rastreio, não um diagnóstico\./)).toBeInTheDocument()
  })
})
