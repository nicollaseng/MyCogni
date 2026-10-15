import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { assessmentOf } from '@/features/onboarding/test/fixtures'
import { renderWithIntl } from '@/test/render'
import { ScreeningHistory } from './screening-history'

const zone = 'America/Sao_Paulo'

const assessments = [
  assessmentOf({ totalScore: 12, completedAt: '2026-10-15T13:00:00Z' }),
  assessmentOf({ instrument: 'gad7', totalScore: 9, completedAt: '2026-10-15T13:00:00Z' }),
  assessmentOf({ totalScore: 17, completedAt: '2026-10-01T13:00:00Z' }),
]

describe('ScreeningHistory', () => {
  it('lists each day the forms were answered, newest first', () => {
    renderWithIntl(<ScreeningHistory timeZone={zone} assessments={assessments} />)

    expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument()
    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('15 de outubroPHQ-9 12 · GAD-7 9')
    expect(rows[1]).toHaveTextContent('1 de outubroPHQ-9 17')
  })

  it('writes the days in the language of the person', () => {
    renderWithIntl(<ScreeningHistory timeZone={zone} assessments={assessments} />, {
      locale: 'en-GB',
    })

    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('15 OctoberPHQ-9 12 · GAD-7 9')
  })

  it('stays hidden until there is something to compare', () => {
    const { container } = renderWithIntl(
      <ScreeningHistory timeZone={zone} assessments={[assessmentOf()]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
