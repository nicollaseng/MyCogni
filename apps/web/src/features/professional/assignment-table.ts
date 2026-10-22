import type { ProfessionalAssignment } from '@mycogni/contracts'
import { assignmentStatuses, catalogEntryOf, type AssignmentStatus } from '@mycogni/domain'
import type { SortDirection } from './patient-table'

export const assignmentFilters = ['all', 'open', 'completed', 'closed'] as const

export type AssignmentFilter = (typeof assignmentFilters)[number]

export const assignmentSortKeys = ['instrument', 'status', 'createdAt', 'completedAt'] as const

export type AssignmentSortKey = (typeof assignmentSortKeys)[number]

export interface AssignmentSort {
  key: AssignmentSortKey
  direction: SortDirection
}

export const defaultAssignmentSort: AssignmentSort = { key: 'createdAt', direction: 'desc' }

const filterStatuses: Readonly<Record<AssignmentFilter, readonly AssignmentStatus[]>> = {
  all: assignmentStatuses,
  open: ['assigned', 'in_progress'],
  completed: ['completed'],
  closed: ['cancelled', 'expired'],
}

const firstDirection: Readonly<Record<AssignmentSortKey, SortDirection>> = {
  instrument: 'asc',
  status: 'asc',
  createdAt: 'desc',
  completedAt: 'desc',
}

export function matchesFilter(
  assignment: ProfessionalAssignment,
  filter: AssignmentFilter,
): boolean {
  return filterStatuses[filter].includes(assignment.status)
}

export function filterCounts(
  assignments: readonly ProfessionalAssignment[],
): Record<AssignmentFilter, number> {
  return {
    all: assignments.length,
    open: assignments.filter((item) => matchesFilter(item, 'open')).length,
    completed: assignments.filter((item) => matchesFilter(item, 'completed')).length,
    closed: assignments.filter((item) => matchesFilter(item, 'closed')).length,
  }
}

function sortValue(assignment: ProfessionalAssignment, key: AssignmentSortKey): number | string {
  switch (key) {
    case 'instrument':
      return catalogEntryOf(assignment.variant).name
    case 'status':
      return assignmentStatuses.indexOf(assignment.status)
    case 'createdAt':
      return Date.parse(assignment.createdAt)
    case 'completedAt':
      return assignment.completedAt === null ? -Infinity : Date.parse(assignment.completedAt)
  }
}

export function compareAssignments({ key, direction }: AssignmentSort) {
  const sign = direction === 'asc' ? 1 : -1
  return (first: ProfessionalAssignment, second: ProfessionalAssignment): number => {
    const firstValue = sortValue(first, key)
    const secondValue = sortValue(second, key)
    const compared =
      typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue || 0
        : String(firstValue).localeCompare(String(secondValue))
    return compared * sign || Date.parse(second.createdAt) - Date.parse(first.createdAt)
  }
}

export function nextAssignmentSort(
  current: AssignmentSort,
  key: AssignmentSortKey,
): AssignmentSort {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { key, direction: firstDirection[key] }
}

export function visibleAssignments(
  assignments: readonly ProfessionalAssignment[],
  filter: AssignmentFilter,
  sort: AssignmentSort,
): ProfessionalAssignment[] {
  return assignments
    .filter((assignment) => matchesFilter(assignment, filter))
    .sort(compareAssignments(sort))
}

export function isUpcoming(assignment: ProfessionalAssignment, now: Date): boolean {
  return assignment.status === 'assigned' && Date.parse(assignment.availableFrom) > now.getTime()
}
