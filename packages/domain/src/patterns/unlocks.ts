import { insightCheckInThreshold } from '../insights/insights.ts'
import { patternRules } from './rules.ts'

export const patternSections = [
  'summary',
  'weekdays',
  'frequent',
  'associations',
  'scores',
] as const

export type PatternSection = (typeof patternSections)[number]

export type ProgressUnit = 'records' | 'days' | 'answers'

export type BlockedReason = 'contexts' | 'disabled'

export type SectionStatus =
  | { section: PatternSection; state: 'ready' }
  | {
      section: PatternSection
      state: 'progress'
      current: number
      required: number
      unit: ProgressUnit
    }
  | { section: PatternSection; state: 'blocked'; reason: BlockedReason }

export interface PatternEvidence {
  periodDays: number
  recordedDays: number
  checkIns: number
  comparableContexts: number
  scoreSessions: number
  summary: { ready: boolean; enabled: boolean; recorded: number }
}

export const associationDays = 2 * patternRules.minContextDays

function counted(
  section: PatternSection,
  current: number,
  required: number,
  unit: ProgressUnit,
): SectionStatus {
  return current >= required
    ? { section, state: 'ready' }
    : { section, state: 'progress', current, required, unit }
}

function summaryStatus({ ready, enabled, recorded }: PatternEvidence['summary']): SectionStatus {
  if (ready) {
    return { section: 'summary', state: 'ready' }
  }
  if (!enabled) {
    return { section: 'summary', state: 'blocked', reason: 'disabled' }
  }
  return {
    section: 'summary',
    state: 'progress',
    current: Math.min(recorded, insightCheckInThreshold),
    required: insightCheckInThreshold,
    unit: 'records',
  }
}

function associationStatus(evidence: PatternEvidence): SectionStatus {
  if (evidence.comparableContexts > 0) {
    return { section: 'associations', state: 'ready' }
  }
  return evidence.recordedDays < associationDays
    ? counted('associations', evidence.recordedDays, associationDays, 'days')
    : { section: 'associations', state: 'blocked', reason: 'contexts' }
}

export function patternUnlocks(evidence: PatternEvidence): SectionStatus[] {
  return [
    summaryStatus(evidence.summary),
    ...(evidence.periodDays >= patternRules.minWeekdayDays
      ? [counted('weekdays', evidence.recordedDays, patternRules.minWeekdayDays, 'days')]
      : []),
    counted('frequent', evidence.checkIns, patternRules.minTaggedCheckIns, 'records'),
    ...(evidence.periodDays >= associationDays ? [associationStatus(evidence)] : []),
    counted('scores', evidence.scoreSessions, patternRules.minScoreSessions, 'answers'),
  ]
}

export function isUnlocked(statuses: readonly SectionStatus[], section: PatternSection): boolean {
  return statuses.some((status) => status.section === section && status.state === 'ready')
}

export function pendingSections(statuses: readonly SectionStatus[]): SectionStatus[] {
  return statuses.filter((status) => status.state !== 'ready')
}
