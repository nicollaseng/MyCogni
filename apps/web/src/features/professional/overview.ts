import type { ActivityDay, PatientSummary, ProfessionalOverview } from '@mycogni/contracts'
import { comparePatients, defaultSort } from './patient-table'

const weekDays = 7

export interface OverviewKpis {
  patients: number
  engaged: number
  engagement: number | null
  checkIns: number
  previousCheckIns: number
  attention: number
  risk: number
  pendingInvitations: number
  expiringSoon: number
}

function sumOf(days: readonly ActivityDay[]): number {
  return days.reduce((total, day) => total + day.checkIns, 0)
}

export function weeklyCheckIns(activity: readonly ActivityDay[]): {
  current: number
  previous: number
} {
  return {
    current: sumOf(activity.slice(-weekDays)),
    previous: sumOf(activity.slice(-weekDays * 2, -weekDays)),
  }
}

export function needsAttention(patient: PatientSummary): boolean {
  return patient.attention.length > 0
}

export function attentionPatients(patients: readonly PatientSummary[]): PatientSummary[] {
  return patients.filter(needsAttention).sort(comparePatients(defaultSort))
}

export function overviewKpis(
  patients: readonly PatientSummary[],
  overview: ProfessionalOverview,
): OverviewKpis {
  const engaged = patients.filter((patient) => patient.checkInsLastWeek > 0).length
  const { current, previous } = weeklyCheckIns(overview.activity)
  return {
    patients: patients.length,
    engaged,
    engagement: patients.length === 0 ? null : engaged / patients.length,
    checkIns: current,
    previousCheckIns: previous,
    attention: patients.filter(needsAttention).length,
    risk: patients.filter((patient) => patient.attention.includes('risk_item')).length,
    pendingInvitations: overview.invitations.pending,
    expiringSoon: overview.invitations.expiringSoon,
  }
}
