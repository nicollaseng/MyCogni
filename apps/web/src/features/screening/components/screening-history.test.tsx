import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { assessmentOf } from '@/features/onboarding/test/fixtures'
import { ScreeningHistory } from './screening-history'

const zone = 'America/Sao_Paulo'

describe('ScreeningHistory', () => {
  it('lists each day the forms were answered, newest first', () => {
    render(
      <ScreeningHistory
        timeZone={zone}
        assessments={[
          assessmentOf({ totalScore: 12, completedAt: '2026-10-15T13:00:00Z' }),
          assessmentOf({ instrument: 'gad7', totalScore: 9, completedAt: '2026-10-15T13:00:00Z' }),
          assessmentOf({ totalScore: 17, completedAt: '2026-10-01T13:00:00Z' }),
        ]}
      />,
    )

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Quinta-feira, 15 de outubroPHQ-9 12 · GAD-7 9')
    expect(rows[1]).toHaveTextContent('Quinta-feira, 1 de outubroPHQ-9 17')
  })

  it('stays hidden until there is something to compare', () => {
    const { container } = render(
      <ScreeningHistory timeZone={zone} assessments={[assessmentOf()]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
