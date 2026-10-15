import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import type { OverviewKpis as Kpis } from '../overview'
import { OverviewKpis } from './overview-kpis'

const kpis: Kpis = {
  patients: 8,
  engaged: 6,
  engagement: 0.75,
  checkIns: 31,
  previousCheckIns: 35,
  pendingAlerts: 2,
  urgentAlerts: 1,
  pendingInvitations: 3,
  expiringSoon: 2,
}

describe('OverviewKpis', () => {
  it('sums up the practice in four figures with their context', () => {
    renderWithIntl(<OverviewKpis kpis={kpis} />)

    expect(screen.getByLabelText('Indicadores').tagName).toBe('DL')
    expect(screen.getByText('Pacientes ativos')).toBeInTheDocument()
    expect(screen.getByText('75% registraram nos últimos 7 dias')).toBeInTheDocument()
    expect(screen.getByText('4 a menos que nos 7 dias anteriores')).toBeInTheDocument()
    expect(screen.getByText('Alertas pendentes')).toBeInTheDocument()
    expect(screen.getByText('1 urgente')).toBeInTheDocument()
    expect(screen.getByText('2 expiram em 24 h')).toBeInTheDocument()
  })

  it('stays calm when nothing needs attention and nobody is linked yet', () => {
    renderWithIntl(
      <OverviewKpis
        kpis={{
          ...kpis,
          patients: 0,
          engaged: 0,
          engagement: null,
          checkIns: 0,
          previousCheckIns: 0,
          pendingAlerts: 0,
          urgentAlerts: 0,
          expiringSoon: 0,
        }}
      />,
    )

    expect(screen.getByText('Ninguém vinculado ainda')).toBeInTheDocument()
    expect(screen.getByText('Igual aos 7 dias anteriores')).toBeInTheDocument()
    expect(screen.getByText('Nenhum alerta pendente')).toBeInTheDocument()
    expect(screen.getByText('Nenhum expira em 24 h')).toBeInTheDocument()
  })
})
