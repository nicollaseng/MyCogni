import { describe, expect, it } from '@jest/globals'
import type { CheckIn } from '@mycogni/contracts'
import { render, screen, within } from '@testing-library/react'
import { EntryList } from './entry-list'

const morning: CheckIn = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000001',
  moodLevel: 1,
  emotions: ['ansiedade'],
  contexts: ['trabalho'],
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

describe('EntryList', () => {
  it('shows each record with its time, mood, tags and note under its day', () => {
    render(
      <EntryList
        timeZone="America/Sao_Paulo"
        groups={[
          { key: '2026-10-14', label: 'Hoje', checkIns: [morning] },
          { key: '2026-10-13', label: 'Ontem', checkIns: [onlyMood] },
        ]}
      />,
    )

    const today = screen.getByRole('region', { name: 'Hoje' })
    expect(within(today).getByText('09:05')).toBeInTheDocument()
    expect(within(today).getByText('Mal')).toBeInTheDocument()
    expect(within(today).getByText('ansiedade · trabalho')).toBeInTheDocument()
    expect(within(today).getByText('Prazo apertado')).toBeInTheDocument()

    const yesterday = screen.getByRole('region', { name: 'Ontem' })
    expect(within(yesterday).getByText('20:40')).toBeInTheDocument()
    expect(within(yesterday).getByText('Bem')).toBeInTheDocument()
    expect(within(yesterday).getAllByRole('listitem')[0]?.textContent).toBe('20:40Bem')
  })
})
