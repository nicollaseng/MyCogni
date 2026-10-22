import { describe, expect, it } from '@jest/globals'
import { practiceDays, practiceMap } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { PracticeSummary } from './practice-summary'

const now = new Date('2026-10-22T15:00:00Z')

function summary(seconds: readonly number[]) {
  const sessions = seconds.map((value, index) => ({
    kind: 'meditation' as const,
    contentId: 'anxiety',
    startedAt: `2026-10-${String(19 + index)}T15:00:00Z`,
    seconds: value,
    completed: true,
    feelingAfter: null,
  }))
  const days = practiceMap(sessions, { now, timeZone: 'America/Sao_Paulo', weeks: 8 })
  renderWithIntl(
    <PracticeSummary
      week={{ minutes: 25, sessions: sessions.length }}
      days={days}
      practisedDays={practiceDays(days)}
      weeks={8}
    />,
  )
}

describe('PracticeSummary', () => {
  it('shows this week in two plain numbers and the last eight weeks as a calm map', () => {
    summary([300, 1200])

    const block = screen.getByRole('region', { name: 'Sua prática' })
    expect(block).toHaveTextContent('Minutos nesta semana25')
    expect(block).toHaveTextContent('Sessões nesta semana2')
    const map = screen.getByRole('img', {
      name: '2 dias com prática nas últimas 8 semanas',
    })
    expect(map.querySelectorAll('[data-day]')).toHaveLength(56)
    expect(map.querySelector('[data-day="2026-10-19"]')).toHaveAttribute('data-level', '2')
    expect(map.querySelector('[data-day="2026-10-20"]')).toHaveAttribute('data-level', '3')
    expect(map.querySelector('[data-day="2026-10-25"]')).toHaveAttribute('data-level', 'future')
    expect(map.textContent).toBe('')
    expect(screen.getByRole('link', { name: 'Ver tudo' })).toHaveAttribute('href', '/zen/practice')
    expect(block).not.toHaveTextContent(/sequência|perdeu/i)
  })

  it('invites gently when there is no practice yet', () => {
    summary([])

    expect(screen.getByText('Quando você praticar, os dias aparecem aqui.')).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'Nenhum dia com prática nas últimas 8 semanas' }),
    ).toBeVisible()
  })
})
