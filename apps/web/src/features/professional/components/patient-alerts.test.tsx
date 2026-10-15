import { describe, expect, it, jest } from '@jest/globals'
import type { ProfessionalAlert } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { alert, testNow, testTimeZone } from '../test-data'
import { OverviewAlerts } from './overview-alerts'
import { PatientAlerts } from './patient-alerts'

type Action = (id: string) => Promise<ActionResult<null>>

const risk = alert({
  patientName: 'Caio Melo',
  reason: 'risk_item',
  level: 'urgent',
  createdAt: '2026-10-15T13:00:00Z',
})
const severe = alert({
  patientName: 'Caio Melo',
  reason: 'severe_screening',
  status: 'acknowledged',
  acknowledgedAt: '2026-10-15T14:00:00Z',
})

function renderPatientAlerts(alerts: readonly ProfessionalAlert[]) {
  const acknowledge = jest.fn<Action>(() => Promise.resolve({ ok: true, value: null }))
  const resolve = jest.fn<Action>(() => Promise.resolve({ ok: true, value: null }))
  const user = userEvent.setup()
  const view = renderWithIntl(
    <PatientAlerts
      alerts={alerts}
      name="Caio Melo"
      now={testNow}
      timeZone={testTimeZone}
      acknowledge={acknowledge}
      resolve={resolve}
    />,
  )
  return { acknowledge, resolve, user, view }
}

describe('PatientAlerts', () => {
  it('shows the pending alerts of the patient and resolves one', async () => {
    const { resolve, user } = renderPatientAlerts([risk, severe])
    const section = screen.getByRole('region', { name: 'Alertas pendentes' })

    expect(within(section).getAllByRole('row')).toHaveLength(3)
    expect(within(section).getByText('Urgente')).toBeInTheDocument()
    expect(within(section).getByText('Visto')).toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Ver todos os alertas' })).toHaveAttribute(
      'href',
      '/pro/alerts',
    )

    await user.click(
      within(section).getByRole('button', {
        name: 'Resolver: Item 9 do PHQ-9 positivo, Caio Melo',
      }),
    )

    expect(resolve).toHaveBeenCalledWith(risk.id)
    expect(await within(section).findByText('Alerta resolvido.')).toBeInTheDocument()
  })

  it('stays out of the way when nothing is pending', () => {
    const { view } = renderPatientAlerts([])

    expect(view.container).toBeEmptyDOMElement()
  })
})

describe('OverviewAlerts', () => {
  it('lists pending alerts with a link to each patient file', () => {
    renderWithIntl(<OverviewAlerts alerts={[risk, severe]} now={testNow} timeZone={testTimeZone} />)

    expect(screen.getAllByRole('link', { name: 'Caio Melo' })[0]).toHaveAttribute(
      'href',
      `/pro/patients/${risk.patientId}`,
    )
    expect(screen.getByText('Questionário com resultado grave')).toBeInTheDocument()
  })

  it('says when nothing is pending', () => {
    renderWithIntl(<OverviewAlerts alerts={[]} now={testNow} timeZone={testTimeZone} />)

    expect(screen.getByText('Nenhum alerta pendente agora.')).toBeInTheDocument()
  })
})
