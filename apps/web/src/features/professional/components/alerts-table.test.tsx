import { describe, expect, it, jest } from '@jest/globals'
import type { ProfessionalAlert } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { alert, testNow, testTimeZone } from '../test-data'
import { AlertsTable } from './alerts-table'

const risk = alert({
  patientName: 'Caio Melo',
  reason: 'risk_item',
  level: 'urgent',
  createdAt: '2026-10-15T14:30:00Z',
})
const low = alert({ patientName: 'Bia Souza', createdAt: '2026-10-15T10:00:00Z' })
const quiet = alert({
  patientName: 'Ana Lima',
  reason: 'inactive',
  level: 'info',
  status: 'acknowledged',
  acknowledgedAt: '2026-10-15T08:00:00Z',
  createdAt: '2026-10-13T07:00:00Z',
})
const done = alert({
  patientName: 'Davi Rocha',
  reason: 'summary_watch',
  status: 'resolved',
  resolvedAt: '2026-10-14T11:00:00Z',
  createdAt: '2026-10-12T10:00:00Z',
})

type Action = (id: string) => Promise<ActionResult<null>>

function renderTable(alerts: readonly ProfessionalAlert[], outcome: ActionResult<null>) {
  const acknowledge = jest.fn<Action>(() => Promise.resolve(outcome))
  const resolve = jest.fn<Action>(() => Promise.resolve(outcome))
  const user = userEvent.setup()
  renderWithIntl(
    <AlertsTable
      alerts={alerts}
      now={testNow}
      timeZone={testTimeZone}
      acknowledge={acknowledge}
      resolve={resolve}
    />,
  )
  return { acknowledge, resolve, user }
}

const success: ActionResult<null> = { ok: true, value: null }

function patients(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent ?? '')
}

function row(name: string): HTMLElement {
  const found = screen.getByRole('link', { name }).closest('tr')
  if (found === null) {
    throw new Error(`No alert for ${name}`)
  }
  return found
}

describe('AlertsTable', () => {
  it('lists pending alerts, the most urgent first, with level and status in words', () => {
    renderTable([quiet, low, done, risk], success)

    expect(patients()).toEqual(['CMCaio Melo', 'BSBia Souza', 'ALAna Lima'])
    const urgent = within(row('Caio Melo'))
    expect(urgent.getByText('Item 9 do PHQ-9 positivo')).toBeInTheDocument()
    expect(urgent.getByText('Urgente')).toBeInTheDocument()
    expect(urgent.getByText('Novo')).toBeInTheDocument()
    expect(urgent.getByText('há 30 min')).toBeInTheDocument()
    expect(within(row('Ana Lima')).getByText('Visto')).toBeInTheDocument()
    expect(within(row('Ana Lima')).getByText('Informativo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Caio Melo' })).toHaveAttribute(
      'href',
      `/pro/patients/${risk.patientId}`,
    )
    expect(screen.getByText('3 alertas')).toBeInTheDocument()
  })

  it('filters by status and level with counts, and searches by patient', async () => {
    const { user } = renderTable([quiet, low, done, risk], success)

    expect(screen.getByRole('radio', { name: 'Pendentes 3' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Resolvidos 1' }))
    expect(patients()).toEqual(['DRDavi Rocha'])
    expect(within(row('Davi Rocha')).getByText('Resolvido')).toBeInTheDocument()
    expect(within(row('Davi Rocha')).queryByRole('button')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Todos 4' }))
    await user.click(screen.getByRole('radio', { name: 'Urgentes 1' }))
    expect(patients()).toEqual(['CMCaio Melo'])

    await user.click(screen.getByRole('radio', { name: 'Todos os níveis 4' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar alerta' }), 'bia')
    expect(patients()).toEqual(['BSBia Souza'])
  })

  it('sorts by patient and flips the direction on the second click', async () => {
    const { user } = renderTable([quiet, low, risk], success)

    await user.click(screen.getByRole('button', { name: 'Paciente' }))
    expect(screen.getByRole('columnheader', { name: /Paciente/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    expect(patients()).toEqual(['ALAna Lima', 'BSBia Souza', 'CMCaio Melo'])

    await user.click(screen.getByRole('button', { name: 'Paciente' }))
    expect(patients()).toEqual(['CMCaio Melo', 'BSBia Souza', 'ALAna Lima'])
  })

  it('marks a new alert as seen and resolves another', async () => {
    const { acknowledge, resolve, user } = renderTable([quiet, risk], success)

    expect(
      within(row('Ana Lima')).queryByRole('button', { name: /Marcar como visto/ }),
    ).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: 'Marcar como visto: Item 9 do PHQ-9 positivo, Caio Melo',
      }),
    )
    expect(acknowledge).toHaveBeenCalledWith(risk.id)
    expect(await screen.findByText('Alerta marcado como visto.')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Resolver: Sem registros há 7+ dias, Ana Lima' }),
    )
    expect(resolve).toHaveBeenCalledWith(quiet.id)
    expect(await screen.findByText('Alerta resolvido.')).toBeInTheDocument()
  })

  it('says when the change did not go through', async () => {
    const { user } = renderTable([risk], { ok: false, error: 'Não deu.' })

    await user.click(screen.getByRole('button', { name: /^Resolver:/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu.')
  })

  it('offers to clear the filters when nothing matches, and explains an empty list', async () => {
    const { user } = renderTable([risk], success)

    await user.type(screen.getByRole('searchbox', { name: 'Buscar alerta' }), 'zz')
    expect(screen.getByText('Nenhum alerta corresponde aos filtros.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(patients()).toEqual(['CMCaio Melo'])
  })

  it('explains that alerts will show up here', () => {
    renderTable([], success)

    expect(
      screen.getByText(
        'Nenhum alerta por aqui. Quando algo pedir sua atenção, ele aparece nesta lista.',
      ),
    ).toBeInTheDocument()
  })
})
