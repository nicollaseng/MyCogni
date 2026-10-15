import type {
  ActivityDay,
  PatientSummary,
  ProfessionalAlert,
  ProfessionalOverview,
} from '@mycogni/contracts'
import { pendingAlerts } from './alert-table'

const weekDays = 7

export interface OverviewKpis {
  patients: number
  engaged: number
  engagement: number | null
  checkIns: number
  previousCheckIns: number
  pendingAlerts: number
  urgentAlerts: number
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

export function overviewKpis(
  patients: readonly PatientSummary[],
  overview: ProfessionalOverview,
  alerts: readonly ProfessionalAlert[],
): OverviewKpis {
  const pending = pendingAlerts(alerts)
  const engaged = patients.filter((patient) => patient.checkInsLastWeek > 0).length
  const { current, previous } = weeklyCheckIns(overview.activity)
  return {
    patients: patients.length,
    engaged,
    engagement: patients.length === 0 ? null : engaged / patients.length,
    checkIns: current,
    previousCheckIns: previous,
    pendingAlerts: pending.length,
    urgentAlerts: pending.filter((alert) => alert.level === 'urgent').length,
    pendingInvitations: overview.invitations.pending,
    expiringSoon: overview.invitations.expiringSoon,
  }
}
