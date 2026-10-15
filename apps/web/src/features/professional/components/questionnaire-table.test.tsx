import { describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { testTimeZone } from '../test-data'
import { QuestionnaireTable } from './questionnaire-table'

function assessment(day: number, overrides: Partial<Assessment> = {}): Assessment {
  return {
    id: `0b7c6c8e-6a8f-4f53-9f4b-${String(day).padStart(12, '0')}`,
    instrument: 'phq9',
    totalScore: 8,
    maxScore: 27,
    severity: 'mild',
    hasRiskFlag: false,
    completedAt: `2026-10-${String(day).padStart(2, '0')}T13:00:00Z`,
    ...overrides,
  }
}

describe('QuestionnaireTable', () => {
  it('shows the newest questionnaires first with score, severity and item 9', () => {
    renderWithIntl(
      <QuestionnaireTable
        timeZone={testTimeZone}
        assessments={[
          assessment(1),
          assessment(12, { totalScore: 18, severity: 'moderately_severe', hasRiskFlag: true }),
          assessment(10, {
            instrument: 'gad7',
            totalScore: 11,
            maxScore: 21,
            severity: 'moderate',
          }),
        ]}
      />,
    )

    const [risk, anxiety, first] = screen.getAllByRole('row').slice(1)
    if (risk === undefined || anxiety === undefined || first === undefined) {
      throw new Error('Expected three questionnaires')
    }
    expect(risk).toHaveTextContent('12 de out. de 2026')
    expect(risk).toHaveTextContent('18/27')
    expect(within(risk).getByText('Moderadamente grave')).toBeInTheDocument()
    expect(within(risk).getByText('Positivo')).toBeInTheDocument()
    expect(within(anxiety).getByText('GAD-7')).toBeInTheDocument()
    expect(within(anxiety).getByText('Não se aplica')).toBeInTheDocument()
    expect(within(first).getByText('Negativo')).toBeInTheDocument()
  })

  it('says when nothing was answered', () => {
    renderWithIntl(<QuestionnaireTable timeZone={testTimeZone} assessments={[]} />)

    expect(
      screen.getByText('Nenhum questionário respondido no período compartilhado.'),
    ).toBeInTheDocument()
  })
})
