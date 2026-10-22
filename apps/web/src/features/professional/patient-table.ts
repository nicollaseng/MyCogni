import type { PatientSummary } from '@mycogni/contracts'
import { attentionReasons, type Severity } from '@mycogni/domain'
import { latestScreenings, screeningColumns } from './screenings'

export const patientFilters = ['all', 'attention', 'inactive', 'phq9', 'gad7'] as const

export type PatientFilter = (typeof patientFilters)[number]

export const sortKeys = [
  'attention',
  'name',
  'lastCheckIn',
  'week',
  'mood',
  'phq9',
  'gad7',
] as const

export type SortKey = (typeof sortKeys)[number]

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: SortKey
  direction: SortDirection
}

export interface PatientView {
  query: string
  filter: PatientFilter
  sort: SortState
}

const firstDirection: Record<SortKey, SortDirection> = {
  attention: 'desc',
  name: 'asc',
  lastCheckIn: 'desc',
  week: 'desc',
  mood: 'asc',
  phq9: 'desc',
  gad7: 'desc',
}

export const defaultSort: SortState = { key: 'attention', direction: 'desc' }

const moderateOrWorse: readonly Severity[] = ['moderate', 'moderately_severe', 'severe']

export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

export function matchesSearch(patient: PatientSummary, query: string): boolean {
  const wanted = normalizeText(query)
  return wanted === '' || normalizeText(patient.name ?? '').includes(wanted)
}

function screenedAtLeastModerate(
  patient: PatientSummary,
  column: keyof typeof screeningColumns,
): boolean {
  const severity = latestScreenings(patient.screenings)[screeningColumns[column]]?.severity
  return severity !== undefined && moderateOrWorse.includes(severity)
}

export function matchesFilter(patient: PatientSummary, filter: PatientFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'attention':
      return patient.attention.length > 0
    case 'inactive':
      return patient.attention.includes('inactive')
    case 'phq9':
    case 'gad7':
      return screenedAtLeastModerate(patient, filter)
  }
}

export function urgencyOf(patient: PatientSummary): number | null {
  const [first] = patient.attention
  if (first === undefined) {
    return null
  }
  return (attentionReasons.length - attentionReasons.indexOf(first)) * 10 + patient.attention.length
}

function sortValue(patient: PatientSummary, key: SortKey): number | string | null {
  switch (key) {
    case 'attention':
      return urgencyOf(patient)
    case 'name':
      return patient.name === null ? null : normalizeText(patient.name)
    case 'lastCheckIn':
      return patient.lastCheckIn === null ? null : Date.parse(patient.lastCheckIn.recordedAt)
    case 'week':
      return patient.checkInsLastWeek
    case 'mood':
      return patient.moodAverage
    case 'phq9':
    case 'gad7':
      return latestScreenings(patient.screenings)[screeningColumns[key]]?.totalScore ?? null
  }
}

function compareValues(first: number | string, second: number | string): number {
  if (typeof first === 'number' && typeof second === 'number') {
    return first - second
  }
  return String(first).localeCompare(String(second))
}

function byName(first: PatientSummary, second: PatientSummary): number {
  const firstName = sortValue(first, 'name')
  const secondName = sortValue(second, 'name')
  if (firstName === null || secondName === null) {
    return firstName === secondName ? 0 : firstName === null ? 1 : -1
  }
  return compareValues(firstName, secondName)
}

export function comparePatients({ key, direction }: SortState) {
  const sign = direction === 'asc' ? 1 : -1
  return (first: PatientSummary, second: PatientSummary): number => {
    const firstValue = sortValue(first, key)
    const secondValue = sortValue(second, key)
    if (firstValue === null || secondValue === null) {
      if (firstValue !== secondValue) {
        return firstValue === null ? 1 : -1
      }
      return key === 'name' ? 0 : byName(first, second)
    }
    const compared = compareValues(firstValue, secondValue) * sign
    return compared === 0 && key !== 'name' ? byName(first, second) : compared
  }
}

export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { key, direction: firstDirection[key] }
}

export function visiblePatients(
  patients: readonly PatientSummary[],
  { query, filter, sort }: PatientView,
): PatientSummary[] {
  return patients
    .filter((patient) => matchesSearch(patient, query) && matchesFilter(patient, filter))
    .sort(comparePatients(sort))
}

export function filterCounts(patients: readonly PatientSummary[]): Record<PatientFilter, number> {
  const counts: Record<PatientFilter, number> = {
    all: 0,
    attention: 0,
    inactive: 0,
    phq9: 0,
    gad7: 0,
  }
  for (const filter of patientFilters) {
    counts[filter] = patients.filter((patient) => matchesFilter(patient, filter)).length
  }
  return counts
}

export function patientFilterOf(value: string | string[] | undefined): PatientFilter {
  return patientFilters.find((filter) => filter === value) ?? 'all'
}
