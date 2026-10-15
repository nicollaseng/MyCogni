import type { AttentionSignals } from '@mycogni/domain'
import type {
  CheckInStatsRecord,
  LastCheckInRecord,
  PatientMetricsRepository,
  ScreeningRecord,
} from './patient-metrics.repository.ts'

export interface LinkedPatient {
  patientId: string
  startedAt: Date
}

export interface PatientSignals<L extends LinkedPatient> {
  link: L
  last: LastCheckInRecord | undefined
  stats: CheckInStatsRecord | undefined
  screenings: ScreeningRecord[]
  signals: AttentionSignals
}

function latestOf(screenings: ScreeningRecord[], instrument: ScreeningRecord['instrument']) {
  return screenings.find((screening) => screening.instrument === instrument) ?? null
}

export async function loadPatientSignals<L extends LinkedPatient>(
  metrics: PatientMetricsRepository,
  professionalId: string,
  links: readonly L[],
  now: Date,
): Promise<PatientSignals<L>[]> {
  const ids = links.map((link) => link.patientId)
  const [lastCheckIns, stats, screenings] = await Promise.all([
    metrics.lastCheckIns(professionalId, ids),
    metrics.checkInStats(professionalId, ids, now),
    metrics.latestScreenings(professionalId, ids),
  ])
  return links.map((link) => {
    const last = lastCheckIns.find((checkIn) => checkIn.patientId === link.patientId)
    const own = screenings.filter((screening) => screening.patientId === link.patientId)
    const patientStats = stats.get(link.patientId)
    const signals: AttentionSignals = {
      latestPhq9: latestOf(own, 'phq9'),
      latestGad7: latestOf(own, 'gad7'),
      moodAverage: patientStats?.moodAverage ?? null,
      previousMoodAverage: patientStats?.previousMoodAverage ?? null,
      lastCheckInAt: last?.recordedAt ?? null,
      linkedAt: link.startedAt,
      now,
    }
    return { link, last, stats: patientStats, screenings: own, signals }
  })
}
