import type { ProfessionalAlert } from '@mycogni/contracts'
import { alertLevels, alertStatuses } from '@mycogni/domain'
import { normalizeText, type SortDirection } from './patient-table'

export const alertLevelFilters = ['all', ...alertLevels] as const

export type AlertLevelFilter = (typeof alertLevelFilters)[number]

export const alertStatusFilters = ['pending', ...alertStatuses, 'all'] as const

export type AlertStatusFilter = (typeof alertStatusFilters)[number]

export const alertSortKeys = ['patient', 'level', 'createdAt', 'status'] as const

export type AlertSortKey = (typeof alertSortKeys)[number]

export interface AlertSort {
  key: AlertSortKey
  direction: SortDirection
}

export interface AlertView {
  level: AlertLevelFilter
  status: AlertStatusFilter
  query: string
  sort: AlertSort
}

export const defaultAlertSort: AlertSort = { key: 'level', direction: 'desc' }

const firstDirection: Record<AlertSortKey, SortDirection> = {
  patient: 'asc',
  level: 'desc',
  createdAt: 'desc',
  status: 'asc',
}

export function isPending(alert: ProfessionalAlert): boolean {
  return alert.status !== 'resolved'
}

function matchesStatus(alert: ProfessionalAlert, status: AlertStatusFilter): boolean {
  if (status === 'all') {
    return true
  }
  return status === 'pending' ? isPending(alert) : alert.status === status
}

function matchesQuery(alert: ProfessionalAlert, query: string): boolean {
  const wanted = normalizeText(query)
  return wanted === '' || normalizeText(alert.patientName ?? '').includes(wanted)
}

function sortValue(alert: ProfessionalAlert, key: AlertSortKey): number | string {
  switch (key) {
    case 'patient':
      return normalizeText(alert.patientName ?? '')
    case 'level':
      return alertLevels.length - alertLevels.indexOf(alert.level)
    case 'createdAt':
      return Date.parse(alert.createdAt)
    case 'status':
      return alertStatuses.indexOf(alert.status)
  }
}

export function compareAlerts({ key, direction }: AlertSort) {
  const sign = direction === 'asc' ? 1 : -1
  return (first: ProfessionalAlert, second: ProfessionalAlert): number => {
    const firstValue = sortValue(first, key)
    const secondValue = sortValue(second, key)
    const compared =
      typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue))
    return compared * sign || Date.parse(second.createdAt) - Date.parse(first.createdAt)
  }
}

export function nextAlertSort(current: AlertSort, key: AlertSortKey): AlertSort {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { key, direction: firstDirection[key] }
}

export function visibleAlerts(
  alerts: readonly ProfessionalAlert[],
  { level, status, query, sort }: AlertView,
): ProfessionalAlert[] {
  return alerts
    .filter(
      (alert) =>
        (level === 'all' || alert.level === level) &&
        matchesStatus(alert, status) &&
        matchesQuery(alert, query),
    )
    .sort(compareAlerts(sort))
}

export function statusCounts(
  alerts: readonly ProfessionalAlert[],
): Record<AlertStatusFilter, number> {
  const counts: Record<AlertStatusFilter, number> = {
    pending: 0,
    open: 0,
    acknowledged: 0,
    resolved: 0,
    all: 0,
  }
  for (const status of alertStatusFilters) {
    counts[status] = alerts.filter((alert) => matchesStatus(alert, status)).length
  }
  return counts
}

export function levelCounts(
  alerts: readonly ProfessionalAlert[],
  status: AlertStatusFilter,
): Record<AlertLevelFilter, number> {
  const counts: Record<AlertLevelFilter, number> = { all: 0, urgent: 0, watch: 0, info: 0 }
  for (const alert of alerts) {
    if (matchesStatus(alert, status)) {
      counts.all += 1
      counts[alert.level] += 1
    }
  }
  return counts
}

export function pendingAlerts(alerts: readonly ProfessionalAlert[]): ProfessionalAlert[] {
  return alerts.filter(isPending).sort(compareAlerts(defaultAlertSort))
}
