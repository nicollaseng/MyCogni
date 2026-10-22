import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { assignment, patientId } from '../questionnaire-test-data'
import { AssignmentsTable } from './assignments-table'

const now = new Date('2026-10-22T12:00:00Z')

const list = [
  assignment({
    id: '0d6c7b3a-1f2e-4d5c-9b8a-000000000001',
    variant: 'pcl5',
    instrument: 'pcl5',
    status: 'completed',
    createdAt: '2026-10-10T12:00:00Z',
    completedAt: '2026-10-11T12:00:00Z',
    result: { total: 40, max: 80, band: 'above_cutoff', flags: ['suicide_screen'] },
  }),
  assignment({
    id: '0d6c7b3a-1f2e-4d5c-9b8a-000000000002',
    variant: 'k10',
    instrument: 'kessler',
    repeatEveryDays: 14,
    availableFrom: '2026-10-30T12:00:00Z',
    createdAt: '2026-10-16T12:00:00Z',
  }),
]

function cancelled(): jest.Mock<(id: string) => Promise<ActionResult<null>>> {
  return jest.fn(() => Promise.resolve<ActionResult<null>>({ ok: true, value: null }))
}

describe('AssignmentsTable', () => {
  it('shows instrument, status, dates, result band and repetition', () => {
    renderWithIntl(
      <AssignmentsTable
        patientId={patientId}
        assignments={list}
        timeZone="America/Sao_Paulo"
        now={now}
        cancel={cancelled()}
      />,
    )

    const answered = screen.getByRole('row', { name: /PCL-5/ })
    const upcoming = screen.getByRole('row', { name: /K10/ })
    expect(answered).toHaveTextContent('PCL-5')
    expect(answered).toHaveTextContent('Estresse pós-traumático')
    expect(answered).toHaveTextContent('Respondido')
    expect(answered).toHaveTextContent('No ponto de corte ou acima')
    expect(answered).toHaveTextContent('40/80')
    expect(within(answered).getByRole('link', { name: 'Ver resultado' })).toHaveAttribute(
      'href',
      `/pro/patients/${patientId}/questionnaires/0d6c7b3a-1f2e-4d5c-9b8a-000000000001`,
    )
    expect(upcoming).toHaveTextContent('A cada 14 dias')
    expect(upcoming).toHaveTextContent('Disponível em 30 de out. de 2026')
  })

  it('filters by status and sorts by column', async () => {
    renderWithIntl(
      <AssignmentsTable
        patientId={patientId}
        assignments={list}
        timeZone="America/Sao_Paulo"
        now={now}
        cancel={cancelled()}
      />,
    )

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Situação' }), 'completed')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('1 questionário')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Situação' }), 'all')
    await userEvent.click(screen.getByRole('button', { name: 'Instrumento' }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('K10')
  })

  it('cancels an open questionnaire after confirming', async () => {
    const cancel = cancelled()
    renderWithIntl(
      <AssignmentsTable
        patientId={patientId}
        assignments={list}
        timeZone="America/Sao_Paulo"
        now={now}
        cancel={cancel}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar K10' }))
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Cancelar questionário',
      }),
    )

    expect(cancel).toHaveBeenCalledWith('0d6c7b3a-1f2e-4d5c-9b8a-000000000002')
    expect(await screen.findByText('Questionário cancelado.')).toBeInTheDocument()
  })

  it('says when nothing was released yet', () => {
    renderWithIntl(
      <AssignmentsTable
        patientId={patientId}
        assignments={[]}
        timeZone="America/Sao_Paulo"
        now={now}
        cancel={cancelled()}
      />,
    )

    expect(screen.getByText('Nenhum questionário liberado ainda.')).toBeInTheDocument()
  })
})
