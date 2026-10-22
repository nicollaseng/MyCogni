import { and, asc, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  careLinks,
  profiles,
  questionnaireAssignments,
  questionnaireResponses,
} from '../../db/schema/index.ts'
import {
  assignmentColumns,
  isUniqueViolation,
  responseColumns,
  withResponse,
  type AssignmentRecord,
  type AssignmentWithResponse,
} from './questionnaire-records.ts'

export interface PatientLink {
  careLinkId: string
  locale: string | null
}

export interface NewAssignment {
  careLinkId: string
  patientId: string
  instrumentId: string
  variant: string
  note: string | null
  repeatEveryDays: number | null
}

export interface TrendPoint {
  assignmentId: string
  completedAt: Date
  score: unknown
}

export class OpenAssignmentError extends Error {
  constructor() {
    super('This questionnaire is already open for this patient')
    this.name = 'OpenAssignmentError'
  }
}

export interface ProfessionalQuestionnaireRepository {
  activeLink(professionalId: string, patientId: string): Promise<PatientLink | undefined>
  create(professionalId: string, assignment: NewAssignment): Promise<AssignmentRecord>
  list(professionalId: string, patientId: string): Promise<AssignmentWithResponse[]>
  find(
    professionalId: string,
    patientId: string,
    assignmentId: string,
  ): Promise<AssignmentWithResponse | undefined>
  trend(professionalId: string, patientId: string, variant: string): Promise<TrendPoint[]>
  cancel(professionalId: string, patientId: string, assignmentId: string): Promise<boolean>
}

export function createProfessionalQuestionnaireRepository(
  db: Database,
): ProfessionalQuestionnaireRepository {
  function withResponses(professionalId: string, patientId: string, assignmentId?: string) {
    return withUser(db, professionalId, async (tx) => {
      const rows = await tx
        .select({ ...assignmentColumns, response: responseColumns })
        .from(questionnaireAssignments)
        .leftJoin(
          questionnaireResponses,
          eq(questionnaireResponses.assignmentId, questionnaireAssignments.id),
        )
        .where(
          and(
            eq(questionnaireAssignments.professionalId, professionalId),
            eq(questionnaireAssignments.patientId, patientId),
            assignmentId === undefined ? undefined : eq(questionnaireAssignments.id, assignmentId),
          ),
        )
        .orderBy(desc(questionnaireAssignments.createdAt))
      return rows.map(withResponse)
    })
  }

  return {
    activeLink(professionalId, patientId) {
      return withUser(db, professionalId, async (tx) => {
        const [link] = await tx
          .select({ careLinkId: careLinks.id, locale: profiles.locale })
          .from(careLinks)
          .leftJoin(profiles, eq(profiles.id, careLinks.patientId))
          .where(
            and(
              eq(careLinks.professionalId, professionalId),
              eq(careLinks.patientId, patientId),
              isNull(careLinks.endedAt),
            ),
          )
        return link
      })
    },
    async create(professionalId, assignment) {
      try {
        return await withUser(db, professionalId, async (tx) => {
          const [row] = await tx
            .insert(questionnaireAssignments)
            .values({ ...assignment, professionalId })
            .returning(assignmentColumns)
          if (row === undefined) {
            throw new Error('The questionnaire was not released')
          }
          return row
        })
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new OpenAssignmentError()
        }
        throw error
      }
    },
    list(professionalId, patientId) {
      return withResponses(professionalId, patientId)
    },
    async find(professionalId, patientId, assignmentId) {
      const [found] = await withResponses(professionalId, patientId, assignmentId)
      return found
    },
    trend(professionalId, patientId, variant) {
      return withUser(db, professionalId, async (tx) => {
        const rows = await tx
          .select({
            assignmentId: questionnaireAssignments.id,
            completedAt: questionnaireResponses.completedAt,
            score: questionnaireResponses.score,
          })
          .from(questionnaireResponses)
          .innerJoin(
            questionnaireAssignments,
            eq(questionnaireAssignments.id, questionnaireResponses.assignmentId),
          )
          .where(
            and(
              eq(questionnaireAssignments.professionalId, professionalId),
              eq(questionnaireAssignments.patientId, patientId),
              eq(questionnaireAssignments.variant, variant),
              isNotNull(questionnaireResponses.completedAt),
            ),
          )
          .orderBy(asc(questionnaireResponses.completedAt))
        return rows.flatMap(({ completedAt, ...point }) =>
          completedAt === null ? [] : [{ ...point, completedAt }],
        )
      })
    },
    cancel(professionalId, patientId, assignmentId) {
      return withUser(db, professionalId, async (tx) => {
        const rows = await tx
          .update(questionnaireAssignments)
          .set({ status: 'cancelled', cancelledAt: new Date() })
          .where(
            and(
              eq(questionnaireAssignments.id, assignmentId),
              eq(questionnaireAssignments.professionalId, professionalId),
              eq(questionnaireAssignments.patientId, patientId),
              inArray(questionnaireAssignments.status, ['assigned', 'in_progress']),
            ),
          )
          .returning({ id: questionnaireAssignments.id })
        return rows.length > 0
      })
    },
  }
}
