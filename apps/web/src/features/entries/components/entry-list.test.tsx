import { describe, expect, it } from '@jest/globals'
import type { CheckIn } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { noFilters } from '../filters'
import type { DayGroup } from '../group-by-day'
import { EntryList } from './entry-list'

const morning: CheckIn = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000001',
  moodLevel: 1,
  emotions: ['anxiety', 'luto'],
  contexts: ['work'],
  note: 'Prazo apertado',
  recordedAt: '2026-10-14T12:05:00Z',
}

const onlyMood: CheckIn = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000002',
  moodLevel: 5,
  emotions: [],
  contexts: [],
  note: null,
  recordedAt: '2026-10-13T23:40:00Z',
}

const older: CheckIn = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000003',
  moodLevel: 3,
  emotions: [],
  contexts: ['free_time'],
  note: null,
  recordedAt: '2026-10-10T15:00:00Z',
}

const groups: DayGroup[] = [
  { key: '2026-10-14', day: 'today', date: new Date(morning.recordedAt), checkIns: [morning] },
  {
    key: '2026-10-13',
    day: 'yesterday',
    date: new Date(onlyMood.recordedAt),
    checkIns: [onlyMood],
  },
  { key: '2026-10-10', day: 'earlier', date: new Date(older.recordedAt), checkIns: [older] },
]

describe('EntryList', () => {
  it('shows each record with its time, mood, tags and note under its day', () => {
    renderWithIntl(<EntryList timeZone="America/Sao_Paulo" groups={groups} />)

    const today = screen.getByRole('region', { name: 'Hoje' })
    expect(within(today).getByText('09:05')).toBeInTheDocument()
    expect(within(today).getByText('Mal')).toBeInTheDocument()
    expect(within(today).getByText('ansiedade · luto · trabalho')).toBeInTheDocument()
    expect(within(today).getByText('Prazo apertado')).toBeInTheDocument()

    const yesterday = screen.getByRole('region', { name: 'Ontem' })
    expect(within(yesterday).getByText('20:40')).toBeInTheDocument()
    expect(within(yesterday).getByText('Bem')).toBeInTheDocument()
    expect(within(yesterday).getAllByRole('listitem')[0]?.textContent).toBe('20:40Bem')

    const saturday = screen.getByRole('region', { name: 'Sábado, 10 de outubro' })
    expect(within(saturday).getByText('tempo livre')).toBeInTheDocument()
  })

  it('opens each record keeping the filters in use for the way back', () => {
    renderWithIntl(
      <EntryList
        timeZone="America/Sao_Paulo"
        groups={groups}
        filters={{ ...noFilters, period: '30', contexts: ['work'] }}
      />,
    )

    const today = screen.getByRole('region', { name: 'Hoje' })
    expect(within(today).getByRole('link')).toHaveAttribute(
      'href',
      `/entries/${morning.id}?period=30&context=work`,
    )
  })

  it('names days, moods and catalog tags in European Portuguese', () => {
    renderWithIntl(<EntryList timeZone="Europe/Lisbon" groups={groups} />, { locale: 'pt-PT' })

    expect(screen.getByRole('region', { name: 'Hoje' })).toBeInTheDocument()
    expect(screen.getByText('ansiedade · luto · trabalho')).toBeInTheDocument()
    expect(screen.getByText('tempos livres')).toBeInTheDocument()
  })

  it('names days, moods and catalog tags in English and keeps typed words as written', () => {
    renderWithIntl(<EntryList timeZone="America/Sao_Paulo" groups={groups} />, {
      locale: 'en-US',
    })

    const today = screen.getByRole('region', { name: 'Today' })
    expect(within(today).getByText('09:05 AM')).toBeInTheDocument()
    expect(within(today).getByText('Bad')).toBeInTheDocument()
    expect(within(today).getByText('anxiety · luto · work')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Yesterday' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Saturday, October 10' })).toBeInTheDocument()
  })
})
