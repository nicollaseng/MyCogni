import { describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { latestPlainResults } from '../latest'
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

const earlierAnxiety: Assessment = {
  ...anxiety,
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000003',
  totalScore: 8,
  severity: 'mild',
  completedAt: '2026-10-01T03:24:00Z',
}

describe('LatestScreening', () => {
  it('shows a plain level for each topic, without names of questionnaires or scores', () => {
    renderWithIntl(
      <LatestScreening
        results={latestPlainResults([depression, anxiety, earlierAnxiety])}
        timeZone="America/Sao_Paulo"
      />,
    )

    const section = screen.getByRole('region', { name: 'Ânimo e ansiedade' })
    const [mood, worry] = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(mood).toHaveTextContent(/^DesânimoAlto$/)
    expect(worry).toHaveTextContent('AnsiedadeAltoMais alto que da última vez')
    expect(mood?.querySelectorAll('[data-filled="true"]')).toHaveLength(4)
    expect(section).not.toHaveTextContent(/PHQ|GAD|27|21/)
    expect(screen.getByText(/Respondidos em quinta-feira, 15 de outubro\./)).toBeInTheDocument()
  })

  it('says when the forms were never answered', () => {
    renderWithIntl(<LatestScreening results={{}} timeZone="America/Sao_Paulo" />)

    expect(screen.getByText('Você ainda não respondeu os questionários.')).toBeInTheDocument()
  })

  it('speaks English', () => {
    renderWithIntl(
      <LatestScreening
        results={latestPlainResults([depression, anxiety])}
        timeZone="America/Sao_Paulo"
      />,
      { locale: 'en-US' },
    )

    expect(screen.getByRole('region', { name: 'Mood and anxiety' })).toBeInTheDocument()
    const [mood, worry] = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(mood).toHaveTextContent('Feeling downHigh')
    expect(worry).toHaveTextContent('AnxietyHigh')
    expect(screen.getByText(/Answered on Thursday, October 15\./)).toBeInTheDocument()
  })

  it('uses the European Portuguese level names in Portugal', () => {
    renderWithIntl(
      <LatestScreening
        results={latestPlainResults([{ ...depression, totalScore: 6, severity: 'mild' }])}
        timeZone="Europe/Lisbon"
      />,
      { locale: 'pt-PT' },
    )

    expect(screen.getByRole('listitem')).toHaveTextContent('DesânimoLigeiro')
    expect(screen.getByText(/É um rastreio, não um diagnóstico\./)).toBeInTheDocument()
  })
})
