import { describe, expect, it } from '@jest/globals'
import type { PatientSummary, ScreeningSummary } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { PatientList } from './patient-list'

const now = new Date('2026-10-15T15:00:00Z')

const depression: ScreeningSummary = {
  instrument: 'phq9',
  totalScore: 12,
  severity: 'moderate',
  hasRiskFlag: false,
  completedAt: '2026-10-14T13:00:00Z',
}

const anxiety: ScreeningSummary = {
  instrument: 'gad7',
  totalScore: 4,
  severity: 'minimal',
  hasRiskFlag: false,
  completedAt: '2026-10-14T13:00:00Z',
}

const marina: PatientSummary = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000001',
  linkId: '0b7c6c8e-6a8f-4f53-9f4b-000000000101',
  name: 'Marina Costa',
  startedAt: '2026-10-01T12:00:00Z',
  sharesHistory: false,
  lastCheckIn: { moodLevel: 5, recordedAt: '2026-10-14T21:00:00Z' },
  checkInsLastWeek: 4,
  screenings: [depression, anxiety],
}

const rafael: PatientSummary = {
  ...marina,
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000002',
  linkId: '0b7c6c8e-6a8f-4f53-9f4b-000000000102',
  name: null,
  lastCheckIn: null,
  checkInsLastWeek: 0,
  screenings: [],
}

function renderList(patients: readonly PatientSummary[]) {
  renderWithIntl(<PatientList patients={patients} timeZone="America/Sao_Paulo" now={now} />)
}

function card(name: string): HTMLElement {
  const link = screen.getByRole('link', { name })
  const item = link.closest('li')
  if (item === null) {
    throw new Error(`No card for ${name}`)
  }
  return item
}

describe('PatientList', () => {
  it('sums up the last entry, the week and the latest questionnaires of each patient', () => {
    renderList([marina])

    const marinaCard = within(card('Marina Costa'))

    expect(screen.getByRole('link', { name: 'Marina Costa' })).toHaveAttribute(
      'href',
      `/pro/patients/${marina.id}`,
    )
    expect(marinaCard.getByText('Bem')).toBeInTheDocument()
    expect(marinaCard.getByText('ontem')).toBeInTheDocument()
    expect(marinaCard.getByText('4 registros')).toBeInTheDocument()
    expect(marinaCard.getByText('Moderada')).toBeInTheDocument()
    expect(marinaCard.getByText('Mínima')).toBeInTheDocument()
    expect(marinaCard.queryByText('Atenção ao item 9 do PHQ-9')).not.toBeInTheDocument()
  })

  it('marks a patient whose latest PHQ-9 has item 9 answered positively', () => {
    renderList([
      {
        ...marina,
        screenings: [
          { ...depression, hasRiskFlag: true, completedAt: '2026-10-15T10:00:00Z' },
          anxiety,
        ],
      },
    ])

    expect(within(card('Marina Costa')).getByText('Atenção ao item 9 do PHQ-9')).toBeVisible()
  })

  it('stops marking once a newer PHQ-9 no longer has the item 9 answered', () => {
    renderList([
      {
        ...marina,
        screenings: [
          { ...depression, hasRiskFlag: true, completedAt: '2026-10-01T10:00:00Z' },
          depression,
        ],
      },
    ])

    expect(screen.queryByText('Atenção ao item 9 do PHQ-9')).not.toBeInTheDocument()
  })

  it('handles a patient without a name, entries or questionnaires', () => {
    renderList([rafael])

    const rafaelCard = within(card('Paciente sem nome'))

    expect(rafaelCard.getByText('Ainda sem registros')).toBeInTheDocument()
    expect(rafaelCard.getByText('Nenhum registro')).toBeInTheDocument()
    expect(rafaelCard.getAllByText('Sem resposta')).toHaveLength(2)
  })

  it('invites the professional to send a first invitation when nobody is linked', () => {
    renderList([])

    expect(screen.getByText('Nenhum paciente por aqui ainda.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Convidar paciente' })).toHaveAttribute(
      'href',
      '/pro/invites',
    )
  })
})
