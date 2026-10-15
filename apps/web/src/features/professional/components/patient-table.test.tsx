import { describe, expect, it } from '@jest/globals'
import type { PatientSummary } from '@mycogni/contracts'
import type { Locale } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import type { PatientFilter } from '../patient-table'
import { patient, screening, testNow, testTimeZone } from '../test-data'
import { PatientTable } from './patient-table'

const joao = patient({
  name: 'João Araújo',
  moodAverage: 4.2,
  previousMoodAverage: 4,
  checkInsLastWeek: 3,
  lastCheckIn: { moodLevel: 5, recordedAt: '2026-10-14T21:00:00Z' },
  screenings: [screening({ totalScore: 6, severity: 'mild' })],
})
const bruno = patient({
  name: 'Bruno Reis',
  moodAverage: 1.6,
  previousMoodAverage: 3.1,
  attention: ['risk_item', 'low_mood', 'mood_drop'],
  screenings: [
    screening({ totalScore: 21, severity: 'severe', hasRiskFlag: true }),
    screening({ instrument: 'gad7', totalScore: 16, severity: 'severe' }),
  ],
})
const ana = patient({
  name: 'Ana Lima',
  moodAverage: null,
  previousMoodAverage: null,
  checkInsLastWeek: 0,
  lastCheckIn: null,
  attention: ['inactive'],
})

function renderTable(
  patients: readonly PatientSummary[],
  { filter = 'all', locale }: { filter?: PatientFilter; locale?: Locale } = {},
) {
  const user = userEvent.setup()
  renderWithIntl(
    <PatientTable
      patients={patients}
      initialFilter={filter}
      now={testNow}
      timeZone={testTimeZone}
    />,
    { locale },
  )
  return { user }
}

function names(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getByRole('link').textContent)
}

function row(name: string): HTMLElement {
  const found = screen.getByRole('link', { name }).closest('tr')
  if (found === null) {
    throw new Error(`No row for ${name}`)
  }
  return found
}

describe('PatientTable', () => {
  it('shows the facts a professional scans for on each row', () => {
    renderTable([joao, bruno])

    const first = within(row('João Araújo'))
    expect(screen.getByRole('link', { name: 'João Araújo' })).toHaveAttribute(
      'href',
      `/pro/patients/${joao.id}`,
    )
    expect(first.getByText('Bem')).toBeInTheDocument()
    expect(first.getByText('ontem')).toBeInTheDocument()
    expect(first.getByText('4,2')).toBeInTheDocument()
    expect(first.getByText('6 de 27')).toBeInTheDocument()
    expect(first.getByText('Leve')).toBeInTheDocument()
    expect(first.getByText('Sem resposta')).toBeInTheDocument()

    const second = within(row('Bruno Reis'))
    expect(second.getByText('Caiu 1,5 em relação aos 7 dias anteriores')).toBeInTheDocument()
    expect(second.getByRole('list', { name: 'Motivos de atenção' })).toHaveTextContent(
      'Item 9 do PHQ-9 positivoHumor baixoQueda de humor',
    )
  })

  it('lists the patients who need attention first, by priority, then by name', () => {
    renderTable([joao, ana, bruno])

    expect(names()).toEqual(['Bruno Reis', 'Ana Lima', 'João Araújo'])
    expect(screen.getByRole('columnheader', { name: /Atenção/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('sorts by a column and flips the direction on the second click', async () => {
    const { user } = renderTable([joao, ana, bruno])

    await user.click(screen.getByRole('button', { name: 'Humor médio 7 d' }))

    expect(screen.getByRole('columnheader', { name: /Humor médio 7 d/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    expect(names()).toEqual(['Bruno Reis', 'João Araújo', 'Ana Lima'])

    await user.click(screen.getByRole('button', { name: 'Humor médio 7 d' }))

    expect(names()).toEqual(['João Araújo', 'Bruno Reis', 'Ana Lima'])

    await user.click(screen.getByRole('button', { name: 'Paciente' }))

    expect(names()).toEqual(['Ana Lima', 'Bruno Reis', 'João Araújo'])
  })

  it('finds a patient typed without accents and counts the results', async () => {
    const { user } = renderTable([joao, ana, bruno])

    await user.type(screen.getByRole('searchbox', { name: 'Buscar paciente' }), 'joao arau')

    expect(names()).toEqual(['João Araújo'])
    expect(screen.getByText('1 paciente')).toBeInTheDocument()
  })

  it('filters by attention and by questionnaire severity, with counts on each filter', async () => {
    const { user } = renderTable([joao, ana, bruno])

    expect(screen.getByRole('radio', { name: 'Precisam de atenção 2' })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Precisam de atenção 2' }))
    expect(names()).toEqual(['Bruno Reis', 'Ana Lima'])

    await user.click(screen.getByRole('radio', { name: 'GAD-7 moderado ou mais 1' }))
    expect(names()).toEqual(['Bruno Reis'])

    await user.click(screen.getByRole('radio', { name: 'Sem registros recentes 1' }))
    expect(names()).toEqual(['Ana Lima'])
  })

  it('opens with the filter chosen in the address', () => {
    renderTable([joao, ana, bruno], { filter: 'attention' })

    expect(screen.getByRole('radio', { name: 'Precisam de atenção 2' })).toBeChecked()
    expect(names()).toEqual(['Bruno Reis', 'Ana Lima'])
  })

  it('offers to clear the filters when nothing matches', async () => {
    const { user } = renderTable([joao, ana])

    await user.type(screen.getByRole('searchbox', { name: 'Buscar paciente' }), 'zé')

    expect(screen.getByText('Nenhum paciente corresponde à busca.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(names()).toEqual(['Ana Lima', 'João Araújo'])
  })

  it('invites the professional to send a first invitation when nobody is linked', () => {
    renderTable([])

    expect(screen.getByRole('heading', { name: 'Nenhum paciente por aqui ainda.' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Enviar o primeiro convite' })).toHaveAttribute(
      'href',
      '/pro/invites?new=1',
    )
  })

  it('speaks the language of the professional', () => {
    renderTable([bruno], { locale: 'en-US' })

    expect(screen.getByRole('button', { name: 'Avg. mood 7 d' })).toBeInTheDocument()
    expect(screen.getByText('PHQ-9 item 9 positive')).toBeInTheDocument()
    expect(screen.getByText('Down 1.5 from the previous 7 days')).toBeInTheDocument()
  })
})
