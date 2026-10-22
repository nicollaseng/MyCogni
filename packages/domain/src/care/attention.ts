import type { Severity } from '../assessments/instrument.ts'

export const attentionReasons = [
  'risk_item',
  'severe_screening',
  'low_mood',
  'mood_drop',
  'inactive',
] as const

export type AttentionReason = (typeof attentionReasons)[number]

export const inactiveAfterDays = 7

export const lowMoodAverage = 2

export const moodDropPoints = 1

const severeScreenings: readonly Severity[] = ['moderately_severe', 'severe']

const dayInMilliseconds = 24 * 60 * 60 * 1000

export interface AttentionSignals {
  latestDepression: { severity: Severity; hasRiskFlag: boolean } | null
  latestAnxiety: { severity: Severity } | null
  moodAverage: number | null
  previousMoodAverage: number | null
  lastCheckInAt: Date | null
  linkedAt: Date
  now: Date
}

function daysSince(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / dayInMilliseconds
}

export function attentionReasonsOf(signals: AttentionSignals): AttentionReason[] {
  const { latestDepression, latestAnxiety, moodAverage, previousMoodAverage, now } = signals
  const lastActivity = signals.lastCheckInAt ?? signals.linkedAt
  const checks: Record<AttentionReason, boolean> = {
    risk_item: latestDepression?.hasRiskFlag === true,
    severe_screening: [latestDepression?.severity, latestAnxiety?.severity].some(
      (severity) => severity !== undefined && severeScreenings.includes(severity),
    ),
    low_mood: moodAverage !== null && moodAverage <= lowMoodAverage,
    mood_drop:
      moodAverage !== null &&
      previousMoodAverage !== null &&
      previousMoodAverage - moodAverage >= moodDropPoints,
    inactive: daysSince(lastActivity, now) >= inactiveAfterDays,
  }
  return attentionReasons.filter((reason) => checks[reason])
}
