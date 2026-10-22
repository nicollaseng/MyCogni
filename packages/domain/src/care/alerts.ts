import type { InstrumentId, Severity } from '../assessments/instrument.ts'
import { domainOf } from '../assessments/scoring.ts'
import type { InsightAttention } from '../insights/insights.ts'
import type { RiskLevel } from '../safety/risk.ts'
import {
  attentionReasonsOf,
  inactiveAfterDays,
  type AttentionReason,
  type AttentionSignals,
} from './attention.ts'

export const alertLevels = ['urgent', 'watch', 'info'] as const

export type AlertLevel = (typeof alertLevels)[number]

export const alertReasons = [
  'risk_item',
  'summary_urgent',
  'severe_screening',
  'summary_watch',
  'low_mood',
  'mood_drop',
  'inactive',
  'note_risk',
] as const

export type AlertReason = (typeof alertReasons)[number]

export const alertStatuses = ['open', 'acknowledged', 'resolved'] as const

export type AlertStatus = (typeof alertStatuses)[number]

export const alertLevelOf: Readonly<Record<AlertReason, AlertLevel>> = {
  risk_item: 'urgent',
  summary_urgent: 'urgent',
  severe_screening: 'watch',
  summary_watch: 'watch',
  low_mood: 'watch',
  mood_drop: 'watch',
  inactive: 'info',
  note_risk: 'urgent',
}

const moodWindowDays = 7

export const alertCooldownDays: Readonly<Record<AlertReason, number>> = {
  risk_item: 0,
  summary_urgent: 0,
  severe_screening: 0,
  summary_watch: 0,
  low_mood: moodWindowDays,
  mood_drop: moodWindowDays,
  inactive: inactiveAfterDays,
  note_risk: 0,
}

export const alertEmailIntervalHours = 24

export interface ScreeningResult {
  instrument: InstrumentId
  severity: Severity
  hasRiskFlag: boolean
}

export type AlertEvent =
  | { kind: 'screening'; result: ScreeningResult }
  | { kind: 'check_in'; signals: AttentionSignals }
  | { kind: 'daily'; signals: AttentionSignals }
  | { kind: 'summary'; attention: InsightAttention }
  | { kind: 'note' }

export interface Alert {
  reason: AlertReason
  level: AlertLevel
}

type SignalEvent = Exclude<AlertEvent['kind'], 'summary' | 'note'>

const reasonsRaisedBy: Readonly<Record<SignalEvent, readonly AttentionReason[]>> = {
  screening: ['risk_item', 'severe_screening'],
  check_in: ['low_mood', 'mood_drop'],
  daily: ['inactive'],
}

const summaryReasons: Readonly<Record<InsightAttention, AlertReason | null>> = {
  none: null,
  watch: 'summary_watch',
  urgent: 'summary_urgent',
}

const hourInMilliseconds = 60 * 60 * 1000

function screeningSignals({
  instrument,
  severity,
  hasRiskFlag,
}: ScreeningResult): AttentionSignals {
  const moment = new Date(0)
  const domain = domainOf(instrument)
  return {
    latestDepression: domain === 'depression' ? { severity, hasRiskFlag } : null,
    latestAnxiety: domain === 'anxiety' ? { severity } : null,
    moodAverage: null,
    previousMoodAverage: null,
    lastCheckInAt: moment,
    linkedAt: moment,
    now: moment,
  }
}

function reasonsOf(event: AlertEvent): readonly AlertReason[] {
  if (event.kind === 'note') {
    return ['note_risk']
  }
  if (event.kind === 'summary') {
    const reason = summaryReasons[event.attention]
    return reason === null ? [] : [reason]
  }
  const signals = event.kind === 'screening' ? screeningSignals(event.result) : event.signals
  const raised = reasonsRaisedBy[event.kind]
  return attentionReasonsOf(signals).filter((reason) => raised.includes(reason))
}

export function raisesNoteAlert(level: RiskLevel): boolean {
  return level === 'urgent'
}

export function alertsFor(event: AlertEvent): Alert[] {
  return reasonsOf(event).map((reason) => ({ reason, level: alertLevelOf[reason] }))
}

export function cooldownStart(reason: AlertReason, now: Date): Date | null {
  const days = alertCooldownDays[reason]
  return days === 0 ? null : new Date(now.getTime() - days * 24 * hourInMilliseconds)
}

export function emailsRightAway(level: AlertLevel): boolean {
  return level === 'urgent'
}

export function emailWindowStart(now: Date): Date {
  return new Date(now.getTime() - alertEmailIntervalHours * hourInMilliseconds)
}

export function alertStatusOf<T>(alert: {
  acknowledgedAt: T | null
  resolvedAt: T | null
}): AlertStatus {
  if (alert.resolvedAt !== null) {
    return 'resolved'
  }
  return alert.acknowledgedAt === null ? 'open' : 'acknowledged'
}
