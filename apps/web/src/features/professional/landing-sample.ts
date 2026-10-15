import type { PatientSummary } from '@mycogni/contracts'
import type { AttentionReason } from '@mycogni/domain'
import type { OverviewKpis } from './overview'

const dayInMs = 24 * 60 * 60 * 1000

export const sampleKpis: OverviewKpis = {
  patients: 12,
  engaged: 10,
  engagement: 10 / 12,
  checkIns: 64,
  previousCheckIns: 57,
  attention: 3,
  risk: 1,
  pendingInvitations: 2,
  expiringSoon: 1,
}

export const sampleActivity: readonly number[] = [
  6, 8, 7, 9, 5, 4, 8, 9, 10, 7, 6, 5, 9, 8, 7, 10, 9, 6, 5, 8, 9, 11, 8, 7, 6, 9, 10, 8, 9, 7,
]

export const sampleMood: readonly (number | null)[] = [
  4,
  4.5,
  4,
  null,
  3.5,
  4,
  4,
  3,
  3.5,
  null,
  4,
  3.5,
  3,
  3,
  null,
  3.5,
  3,
  2.5,
  3,
  null,
  2.5,
  2,
  2.5,
  null,
  2,
  2.5,
  2,
  1.5,
  2,
  2,
]

export interface SampleAttention {
  name: string
  reasons: AttentionReason[]
  lastSeenDays: number
}

export const sampleAttention: readonly SampleAttention[] = [
  { name: 'Rafael Mendes', reasons: ['risk_item', 'low_mood'], lastSeenDays: 0 },
  { name: 'Beatriz Nogueira', reasons: ['severe_screening', 'mood_drop'], lastSeenDays: 1 },
  { name: 'João Pereira', reasons: ['inactive'], lastSeenDays: 9 },
]

export interface SampleEntry {
  daysAgo: number
  hoursAgo: number
  moodLevel: number
  emotions: readonly string[]
  note: 'note1' | 'note2' | null
}

export const sampleEntries: readonly SampleEntry[] = [
  { daysAgo: 0, hoursAgo: 2, moodLevel: 2, emotions: ['anxiety', 'tiredness'], note: 'note1' },
  { daysAgo: 1, hoursAgo: 3, moodLevel: 2, emotions: ['sadness'], note: null },
  { daysAgo: 2, hoursAgo: 1, moodLevel: 3, emotions: ['calm', 'worry'], note: 'note2' },
]

export function samplePatient(now: Date): PatientSummary {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    linkId: '00000000-0000-4000-8000-000000000002',
    name: 'Rafael Mendes',
    photoUrl: null,
    startedAt: new Date(now.getTime() - 46 * dayInMs).toISOString(),
    sharesHistory: true,
    lastCheckIn: { moodLevel: 2, recordedAt: now.toISOString() },
    checkInsLastWeek: 6,
    checkInsLast30Days: 24,
    moodAverage: 2.1,
    previousMoodAverage: 3.2,
    screenings: [
      {
        instrument: 'phq9',
        totalScore: 16,
        severity: 'moderately_severe',
        hasRiskFlag: true,
        completedAt: new Date(now.getTime() - 2 * dayInMs).toISOString(),
      },
    ],
    attention: ['risk_item', 'low_mood', 'mood_drop'],
    termsOutdated: false,
  }
}

export function sampleEntryDate(entry: SampleEntry, now: Date): Date {
  return new Date(now.getTime() - entry.daysAgo * dayInMs - entry.hoursAgo * 60 * 60 * 1000)
}
