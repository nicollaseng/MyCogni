import { describe, expect, it } from '@jest/globals'
import {
  defaultAlertSort,
  levelCounts,
  nextAlertSort,
  pendingAlerts,
  statusCounts,
  visibleAlerts,
  type AlertView,
} from './alert-table'
import { alert } from './test-data'

const risk = alert({
  patientName: 'Caio Melo',
  reason: 'risk_item',
  level: 'urgent',
  createdAt: '2026-10-14T09:00:00Z',
})
const quiet = alert({
  patientName: 'Ana Lima',
  reason: 'inactive',
  level: 'info',
  status: 'acknowledged',
  acknowledgedAt: '2026-10-15T08:00:00Z',
  createdAt: '2026-10-15T07:00:00Z',
})
const low = alert({ patientName: 'Bia Souza', createdAt: '2026-10-15T10:00:00Z' })
const done = alert({
  patientName: 'Átila Nunes',
  reason: 'summary_urgent',
  level: 'urgent',
  status: 'resolved',
  resolvedAt: '2026-10-15T11:00:00Z',
  createdAt: '2026-10-13T10:00:00Z',
})
const all = [quiet, low, done, risk]

const view: AlertView = { level: 'all', status: 'pending', query: '', sort: defaultAlertSort }

function names(alerts: readonly { patientName: string | null }[]): (string | null)[] {
  return alerts.map((item) => item.patientName)
}

describe('visibleAlerts', () => {
  it('shows pending alerts by default, the most urgent first and then the newest', () => {
    expect(names(visibleAlerts(all, view))).toEqual(['Caio Melo', 'Bia Souza', 'Ana Lima'])
  })

  it('filters by status, by level and by patient name without accents', () => {
    expect(names(visibleAlerts(all, { ...view, status: 'resolved' }))).toEqual(['Átila Nunes'])
    expect(names(visibleAlerts(all, { ...view, status: 'open' }))).toEqual([
      'Caio Melo',
      'Bia Souza',
    ])
    expect(names(visibleAlerts(all, { ...view, status: 'all', level: 'urgent' }))).toEqual([
      'Caio Melo',
      'Átila Nunes',
    ])
    expect(names(visibleAlerts(all, { ...view, status: 'all', query: 'atila' }))).toEqual([
      'Átila Nunes',
    ])
  })

  it('sorts by patient, time and status', () => {
    const everything = { ...view, status: 'all' } as const
    expect(
      names(visibleAlerts(all, { ...everything, sort: { key: 'patient', direction: 'asc' } })),
    ).toEqual(['Ana Lima', 'Átila Nunes', 'Bia Souza', 'Caio Melo'])
    expect(
      names(visibleAlerts(all, { ...everything, sort: { key: 'createdAt', direction: 'desc' } })),
    ).toEqual(['Bia Souza', 'Ana Lima', 'Caio Melo', 'Átila Nunes'])
    expect(
      names(visibleAlerts(all, { ...everything, sort: { key: 'status', direction: 'asc' } })),
    ).toEqual(['Bia Souza', 'Caio Melo', 'Ana Lima', 'Átila Nunes'])
  })

  it('treats a missing name as empty text', () => {
    const unnamed = alert({ patientName: null })
    expect(
      visibleAlerts([low, unnamed], { ...view, sort: { key: 'patient', direction: 'asc' } })[0],
    ).toBe(unnamed)
    expect(visibleAlerts([unnamed], { ...view, query: 'bia' })).toEqual([])
  })
})

describe('alert counts', () => {
  it('counts every status and the levels within the chosen status', () => {
    expect(statusCounts(all)).toEqual({
      pending: 3,
      open: 2,
      acknowledged: 1,
      resolved: 1,
      all: 4,
    })
    expect(levelCounts(all, 'pending')).toEqual({ all: 3, urgent: 1, watch: 1, info: 1 })
    expect(levelCounts(all, 'resolved')).toEqual({ all: 1, urgent: 1, watch: 0, info: 0 })
  })

  it('keeps only pending alerts for the overview, urgent first', () => {
    expect(pendingAlerts(all)).toEqual([risk, low, quiet])
  })
})

describe('nextAlertSort', () => {
  it('starts each column in its natural direction and flips on the second click', () => {
    expect(nextAlertSort(defaultAlertSort, 'patient')).toEqual({ key: 'patient', direction: 'asc' })
    expect(nextAlertSort(defaultAlertSort, 'level')).toEqual({ key: 'level', direction: 'asc' })
    expect(nextAlertSort({ key: 'createdAt', direction: 'asc' }, 'createdAt')).toEqual({
      key: 'createdAt',
      direction: 'desc',
    })
  })
})
