import type { ProfessionalKind } from '@mycogni/domain'
import { and, desc, eq, isNull } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  professionalProfiles,
  questionnaireAssignments,
  questionnaireResponses,
} from '../../db/schema/index.ts'
import {
  assignmentColumns,
  isUniqueViolation,
  responseColumns,
  withResponse,
  type AssignmentWithResponse,
  type ResponseRecord,
} from './questionnaire-records.ts'

export interface PatientAssignmentRecord extends AssignmentWithResponse {
  professional: { name: string; kind: ProfessionalKind }
}

export interface NewResponse {
  instrumentId: string
  instrumentVersion: string
  locale: string
  answers: (number | null)[]
}

export interface CompletedResponse {
  answers: number[]
  score: unknown
  flags: string[]
  completedAt: Date
}

export interface PatientQuestionnaireRepository {
  list(patientId: string): Promise<PatientAssignmentRecord[]>
  find(patientId: string, assignmentId: string): Promise<PatientAssignmentRecord | undefined>
  start(patientId: string, assignmentId: string, response: NewResponse): Promise<boolean>
  saveAnswers(
    patientId: string,
    assignmentId: string,
    answers: (number | null)[],
  ): Promise<ResponseRecord | undefined>
  complete(
    patientId: string,
    assignmentId: string,
    response: CompletedResponse,
  ): Promise<ResponseRecord | undefined>
}

export function createPatientQuestionnaireRepository(db: Database): PatientQuestionnaireRepository {
  function assignmentsOf(patientId: string, assignmentId?: string) {
    return withUser(db, patientId, async (tx) => {
      const rows = await tx
        .select({
          ...assignmentColumns,
          response: responseColumns,
          professional: { name: professionalProfiles.fullName, kind: professionalProfiles.kind },
        })
        .from(questionnaireAssignments)
        .innerJoin(
          professionalProfiles,
          eq(professionalProfiles.userId, questionnaireAssignments.professionalId),
        )
        .leftJoin(
          questionnaireResponses,
          eq(questionnaireResponses.assignmentId, questionnaireAssignments.id),
        )
        .where(
          and(
            eq(questionnaireAssignments.patientId, patientId),
            assignmentId === undefined ? undefined : eq(questionnaireAssignments.id, assignmentId),
          ),
        )
        .orderBy(desc(questionnaireAssignments.availableFrom))
      return rows.map(({ professional, ...row }) => ({ ...withResponse(row), professional }))
    })
  }

  function openResponse(assignmentId: string, patientId: string) {
    return and(
      eq(questionnaireResponses.assignmentId, assignmentId),
      eq(questionnaireResponses.patientId, patientId),
      isNull(questionnaireResponses.completedAt),
    )
  }

  return {
    list(patientId) {
      return assignmentsOf(patientId)
    },
    async find(patientId, assignmentId) {
      const [found] = await assignmentsOf(patientId, assignmentId)
      return found
    },
    async start(patientId, assignmentId, response) {
      try {
        await withUser(db, patientId, (tx) =>
          tx.insert(questionnaireResponses).values({
            ...response,
            assignmentId,
            patientId,
            consentedAt: new Date(),
          }),
        )
        return true
      } catch (error) {
        if (isUniqueViolation(error)) {
          return false
        }
        throw error
      }
    },
    saveAnswers(patientId, assignmentId, answers) {
      return withUser(db, patientId, async (tx) => {
        const [row] = await tx
          .update(questionnaireResponses)
          .set({ answers })
          .where(openResponse(assignmentId, patientId))
          .returning(responseColumns)
        return row
      })
    },
    complete(patientId, assignmentId, response) {
      return withUser(db, patientId, async (tx) => {
        const [row] = await tx
          .update(questionnaireResponses)
          .set(response)
          .where(openResponse(assignmentId, patientId))
          .returning(responseColumns)
        return row
      })
    },
  }
}
