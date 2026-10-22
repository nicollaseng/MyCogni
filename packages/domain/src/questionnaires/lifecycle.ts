import { catalogEntryOf, type QuestionnaireArea, type QuestionnaireVariant } from './catalog.ts'
import type { PlainLevel } from '../assessments/plain.ts'
import { plainLevelOfTotal, type QuestionnaireResult } from './scoring.ts'

export const assignmentStatuses = [
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
  'expired',
] as const

export type AssignmentStatus = (typeof assignmentStatuses)[number]

export const openAssignmentStatuses = ['assigned', 'in_progress'] as const

export const repeatIntervals = [7, 14, 28] as const

export type RepeatInterval = (typeof repeatIntervals)[number]

export const assignmentNoteMaxLength = 280

export const assignmentLifetimeDays = 30

const dayInMilliseconds = 24 * 60 * 60 * 1000

export function isRepeatInterval(value: unknown): value is RepeatInterval {
  return repeatIntervals.some((days) => days === value)
}

export function isOpenAssignment(status: AssignmentStatus): boolean {
  return openAssignmentStatuses.some((open) => open === status)
}

export function nextAvailableFrom(completedAt: Date, days: RepeatInterval): Date {
  return new Date(completedAt.getTime() + days * dayInMilliseconds)
}

export function expiresAt(availableFrom: Date): Date {
  return new Date(availableFrom.getTime() + assignmentLifetimeDays * dayInMilliseconds)
}

export interface PlainQuestionnaireSummary {
  area: QuestionnaireArea
  level: PlainLevel
  safety: boolean
}

export function plainSummaryOf(
  variant: QuestionnaireVariant,
  { score, flags }: QuestionnaireResult,
): PlainQuestionnaireSummary {
  return {
    area: catalogEntryOf(variant).area,
    level: plainLevelOfTotal(variant, score.total),
    safety: flags.includes('risk_item'),
  }
}
