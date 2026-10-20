import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { assessmentOf } from '@/features/onboarding/test/fixtures'
import { renderWithIntl } from '@/test/render'
import { ScreeningHistory } from './screening-history'

const zone = 'America/Sao_Paulo'

const assessments = [
  assessmentOf({ totalScore: 3, severity: 'minimal', completedAt: '2026-10-15T09:00:00Z' }),
  assessmentOf({ totalScore: 12, severity: 'moderate', completedAt: '2026-10-15T13:00:00Z' }),
  assessmentOf({
    instrument: 'gad7',
    totalScore: 9,
    severity: 'mild',
    completedAt: '2026-10-15T13:00:00Z',
  }),
  assessmentOf({
    totalScore: 17,
    severity: 'moderately_severe',
    completedAt: '2026-10-01T13:00:00Z',
  }),
]

describe('ScreeningHistory', () => {
  it('lists each day the forms were answered, newest first, keeping the latest answer of the day', () => {
    renderWithIntl(<ScreeningHistory timeZone={zone} assessments={assessments} />)

    const table = screen.getByRole('table', { name: 'Histórico' })
    const [header, latest, earlier] = within(table).getAllByRole('row')
    expect(header).toHaveTextContent('DiaDesânimoAnsiedade')
    expect(latest).toHaveTextContent('15 de outubroModeradoLeve')
    expect(earlier).toHaveTextContent('1 de outubroAlto–')
    expect(table).not.toHaveTextContent(/PHQ|GAD|\b1[27]\b/)
  })

  it('writes the days in the language of the person', () => {
    renderWithIntl(<ScreeningHistory timeZone={zone} assessments={assessments} />, {
      locale: 'en-GB',
    })

    const table = screen.getByRole('table', { name: 'History' })
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('15 OctoberModerateMild')
  })

  it('stays hidden until there is something to compare', () => {
    const { container } = renderWithIntl(
      <ScreeningHistory timeZone={zone} assessments={[assessmentOf()]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
