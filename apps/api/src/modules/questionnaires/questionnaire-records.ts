import type { AssignmentStatus } from '@mycogni/domain'
import { questionnaireAssignments, questionnaireResponses } from '../../db/schema/index.ts'

export interface AssignmentRecord {
  id: string
  professionalId: string
  patientId: string
  careLinkId: string
  instrumentId: string
  variant: string
  note: string | null
  repeatEveryDays: number | null
  availableFrom: Date
  status: AssignmentStatus
  createdAt: Date
  completedAt: Date | null
  cancelledAt: Date | null
}

export interface ResponseRecord {
  id: string
  instrumentVersion: string
  locale: string
  answers: unknown
  score: unknown
  flags: string[]
  consentedAt: Date
  startedAt: Date
  completedAt: Date | null
}

export interface AssignmentWithResponse {
  assignment: AssignmentRecord
  response: ResponseRecord | null
}

export const assignmentColumns = {
  id: questionnaireAssignments.id,
  professionalId: questionnaireAssignments.professionalId,
  patientId: questionnaireAssignments.patientId,
  careLinkId: questionnaireAssignments.careLinkId,
  instrumentId: questionnaireAssignments.instrumentId,
  variant: questionnaireAssignments.variant,
  note: questionnaireAssignments.note,
  repeatEveryDays: questionnaireAssignments.repeatEveryDays,
  availableFrom: questionnaireAssignments.availableFrom,
  status: questionnaireAssignments.status,
  createdAt: questionnaireAssignments.createdAt,
  completedAt: questionnaireAssignments.completedAt,
  cancelledAt: questionnaireAssignments.cancelledAt,
}

export const responseColumns = {
  id: questionnaireResponses.id,
  instrumentVersion: questionnaireResponses.instrumentVersion,
  locale: questionnaireResponses.locale,
  answers: questionnaireResponses.answers,
  score: questionnaireResponses.score,
  flags: questionnaireResponses.flags,
  consentedAt: questionnaireResponses.consentedAt,
  startedAt: questionnaireResponses.startedAt,
  completedAt: questionnaireResponses.completedAt,
}

function databaseCode(error: unknown): unknown {
  const cause: unknown = error instanceof Error ? error.cause : undefined
  return typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : undefined
}

export function isUniqueViolation(error: unknown): boolean {
  return databaseCode(error) === '23505'
}

export function isPolicyViolation(error: unknown): boolean {
  return databaseCode(error) === '42501'
}

export function withResponse({
  response,
  ...assignment
}: AssignmentRecord & { response: ResponseRecord | null }): AssignmentWithResponse {
  return { assignment, response }
}
